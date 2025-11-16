"""
ML Training Service - Adaptive Risk Weight Learning System.

This service implements the core innovation: learning optimal risk weights
from actual contract outcomes to replace static Excel-based risk matrices.
"""
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (
    accuracy_score, roc_auc_score, classification_report,
    confusion_matrix, precision_recall_curve
)
from sklearn.preprocessing import StandardScaler
import joblib
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import logging

from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from src.db.models import (
    Contract, RiskAssessment, RiskMatrixVersion,
    ContractOutcome, RiskCategory
)
from src.config import settings
from src.services.contract_risk_matrix import ContractRiskMatrix

logger = logging.getLogger(__name__)


class MLTrainingService:
    """
    Adaptive machine learning service for risk weight optimization.

    This service learns from historical contract outcomes to determine
    which risk categories (financial, legal, ESG, etc.) are most predictive
    of bad outcomes, and automatically updates the risk scoring weights.
    """

    # Risk categories in order
    RISK_CATEGORIES = [
        "financial", "legal", "esg", "geopolitical",
        "operational", "pricing", "social", "performance"
    ]

    def __init__(self, db: Session):
        self.db = db
        self.scaler = StandardScaler()

    def prepare_training_data(self) -> Tuple[pd.DataFrame, pd.Series, List[Dict]]:
        """
        Prepare training dataset from contracts with outcomes.

        Returns:
            X: Feature DataFrame (risk scores)
            y: Target Series (binary: bad outcome or not)
            metadata: List of contract metadata for analysis
        """
        logger.info("Preparing training data from contract outcomes...")

        # Query contracts with outcomes and their risk assessments
        contracts_with_outcomes = (
            self.db.query(Contract, RiskAssessment)
            .join(RiskAssessment, Contract.id == RiskAssessment.contract_id)
            .filter(Contract.outcome.isnot(None))
            .all()
        )

        if not contracts_with_outcomes:
            raise ValueError("No contracts with outcomes found for training")

        # Build dataset
        data = []
        metadata = []

        for contract, assessment in contracts_with_outcomes:
            # Create feature vector from risk scores
            features = {
                "financial_score": assessment.financial_score,
                "legal_score": assessment.legal_score,
                "esg_score": assessment.esg_score,
                "geopolitical_score": assessment.geopolitical_score,
                "operational_score": assessment.operational_score,
                "pricing_score": assessment.pricing_score,
                "social_score": assessment.social_score,
                "performance_score": assessment.performance_score,
            }

            # Add contract term features if available in risk_flags
            if contract.risk_flags and isinstance(contract.risk_flags, dict):
                contract_features = contract.risk_flags.get("contract_terms", {})
                for key, value in contract_features.items():
                    if isinstance(value, (int, float)):
                        features[key] = value

            # Define bad outcomes (what we want to predict/avoid)
            bad_outcomes = [
                ContractOutcome.TERMINATED_EARLY,
                ContractOutcome.DISPUTE,
                ContractOutcome.CLAIM,
                ContractOutcome.PENALTY
            ]
            is_bad_outcome = 1 if contract.outcome in bad_outcomes else 0

            # Add target
            features["target"] = is_bad_outcome

            # Add contextual features (optional, can improve model)
            features["contract_value"] = contract.contract_value or 0
            features["loss_amount"] = contract.loss_amount or 0

            data.append(features)

            # Store metadata for analysis
            metadata.append({
                "contract_id": contract.id,
                "contract_number": contract.contract_number,
                "supplier_id": contract.supplier_id,
                "outcome": contract.outcome.value,
                "loss_amount": contract.loss_amount,
                "signed_date": contract.signed_date.isoformat() if contract.signed_date else None,
            })

        df = pd.DataFrame(data)
        logger.info(f"Prepared {len(df)} samples for training")
        logger.info(f"Outcome distribution: {df['target'].value_counts().to_dict()}")

        # Separate features and target
        X = df[[f"{cat}_score" for cat in self.RISK_CATEGORIES]]
        y = df["target"]

        return X, y, metadata

    def train_model(
        self,
        model_type: str = "logistic_regression",
        min_samples: int = None
    ) -> Dict:
        """
        Train ML model on contract outcomes and extract feature importance.

        Args:
            model_type: Type of model to train ("logistic_regression", "random_forest", "gradient_boosting")
            min_samples: Minimum number of samples required (default from settings)

        Returns:
            Dictionary with training results and metrics
        """
        min_samples = min_samples or settings.ML_MODEL_MIN_SAMPLES

        logger.info(f"Starting model training with {model_type}...")

        # Prepare data
        X, y, metadata = self.prepare_training_data()

        # Check minimum samples
        if len(X) < min_samples:
            raise ValueError(
                f"Insufficient training data: {len(X)} samples (minimum: {min_samples})"
            )

        # Train/test split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            test_size=settings.ML_MODEL_VALIDATION_SPLIT,
            random_state=42,
            stratify=y  # Maintain class balance
        )

        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        # Select and train model
        if model_type == "logistic_regression":
            model = LogisticRegression(
                max_iter=1000,
                random_state=42,
                class_weight="balanced"  # Handle imbalanced data
            )
        elif model_type == "random_forest":
            model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                class_weight="balanced"
            )
        elif model_type == "gradient_boosting":
            model = GradientBoostingClassifier(
                n_estimators=100,
                max_depth=5,
                random_state=42
            )
        else:
            raise ValueError(f"Unsupported model type: {model_type}")

        # Train
        logger.info("Training model...")
        model.fit(X_train_scaled, y_train)

        # Evaluate
        y_pred = model.predict(X_test_scaled)
        y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]

        accuracy = accuracy_score(y_test, y_pred)
        auc = roc_auc_score(y_test, y_pred_proba)

        logger.info(f"Model performance - Accuracy: {accuracy:.3f}, AUC: {auc:.3f}")

        # Cross-validation
        cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring="roc_auc")
        logger.info(f"Cross-validation AUC: {cv_scores.mean():.3f} (+/- {cv_scores.std():.3f})")

        # Extract feature importance
        if hasattr(model, "coef_"):
            # For linear models
            feature_importance = np.abs(model.coef_[0])
        elif hasattr(model, "feature_importances_"):
            # For tree-based models
            feature_importance = model.feature_importances_
        else:
            raise ValueError("Model does not support feature importance extraction")

        # Normalize to sum to 1 (convert to weights)
        feature_importance_normalized = feature_importance / feature_importance.sum()

        # Create feature importance dictionary
        feature_importance_dict = {
            cat: float(imp)
            for cat, imp in zip(self.RISK_CATEGORIES, feature_importance_normalized)
        }

        # Filter out very low importance features
        threshold = settings.ML_FEATURE_IMPORTANCE_THRESHOLD
        feature_importance_filtered = {
            k: v for k, v in feature_importance_dict.items()
            if v >= threshold
        }

        # Renormalize after filtering
        total_filtered = sum(feature_importance_filtered.values())
        feature_importance_final = {
            k: v / total_filtered
            for k, v in feature_importance_filtered.items()
        }

        # Add back filtered features with zero weight
        for cat in self.RISK_CATEGORIES:
            if cat not in feature_importance_final:
                feature_importance_final[cat] = 0.0

        logger.info("Feature importance (new weights):")
        for cat, weight in sorted(feature_importance_final.items(), key=lambda x: x[1], reverse=True):
            logger.info(f"  {cat}: {weight:.4f}")

        # Save model
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        model_filename = f"{model_type}_{timestamp}.joblib"
        model_path = Path(settings.MODEL_STORAGE_PATH) / model_filename

        joblib.dump({
            "model": model,
            "scaler": self.scaler,
            "feature_names": self.RISK_CATEGORIES,
            "metadata": {
                "model_type": model_type,
                "trained_at": timestamp,
                "n_samples": len(X),
                "n_train": len(X_train),
                "n_test": len(X_test),
            }
        }, model_path)

        logger.info(f"Model saved to {model_path}")

        # Return results
        return {
            "model_type": model_type,
            "model_path": str(model_path),
            "n_samples": len(X),
            "n_train": len(X_train),
            "n_test": len(X_test),
            "accuracy": float(accuracy),
            "auc": float(auc),
            "cv_auc_mean": float(cv_scores.mean()),
            "cv_auc_std": float(cv_scores.std()),
            "feature_importance": feature_importance_final,
            "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
            "classification_report": classification_report(y_test, y_pred, output_dict=True),
        }

    def create_risk_matrix_version(
        self,
        training_results: Dict,
        description: str = None,
        auto_approve: bool = None
    ) -> RiskMatrixVersion:
        """
        Create a new risk matrix version from training results.

        Args:
            training_results: Results from train_model()
            description: Description of this version
            auto_approve: Whether to auto-approve (default from settings)

        Returns:
            Created RiskMatrixVersion object
        """
        auto_approve = auto_approve if auto_approve is not None else settings.RISK_MATRIX_AUTO_APPROVE

        # Generate version string
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        version = f"v_ml_{training_results['model_type']}_{timestamp}"

        # Extract weights
        weights = training_results["feature_importance"]

        # Create version
        new_version = RiskMatrixVersion(
            version=version,
            financial_weight=weights.get("financial", 0.0),
            legal_weight=weights.get("legal", 0.0),
            esg_weight=weights.get("esg", 0.0),
            geopolitical_weight=weights.get("geopolitical", 0.0),
            operational_weight=weights.get("operational", 0.0),
            pricing_weight=weights.get("pricing", 0.0),
            social_weight=weights.get("social", 0.0),
            performance_weight=weights.get("performance", 0.0),
            is_active=False,  # Not active until approved
            is_approved=auto_approve,
            approved_at=datetime.now() if auto_approve else None,
            trained_on_samples=training_results["n_samples"],
            model_accuracy=training_results["accuracy"],
            model_auc=training_results["auc"],
            feature_importance=training_results["feature_importance"],
            model_path=training_results["model_path"],
            model_type=training_results["model_type"],
            description=description or f"ML-generated weights from {training_results['n_samples']} contracts",
            training_notes=json.dumps({
                "cv_auc": training_results["cv_auc_mean"],
                "confusion_matrix": training_results["confusion_matrix"],
            })
        )

        self.db.add(new_version)
        self.db.commit()
        self.db.refresh(new_version)

        logger.info(f"Created risk matrix version: {version}")
        logger.info(f"Approved: {new_version.is_approved}, Active: {new_version.is_active}")

        return new_version

    def approve_version(self, version_id: int, user_id: int = None) -> RiskMatrixVersion:
        """
        Approve a risk matrix version (human-in-the-loop).

        Args:
            version_id: ID of the version to approve
            user_id: ID of approving user

        Returns:
            Updated RiskMatrixVersion
        """
        version = self.db.query(RiskMatrixVersion).filter(
            RiskMatrixVersion.id == version_id
        ).first()

        if not version:
            raise ValueError(f"Risk matrix version {version_id} not found")

        if version.is_approved:
            logger.warning(f"Version {version.version} is already approved")
            return version

        version.is_approved = True
        version.approved_at = datetime.now()
        version.approved_by = user_id

        self.db.commit()
        self.db.refresh(version)

        logger.info(f"Approved risk matrix version: {version.version}")
        return version

    def activate_version(self, version_id: int) -> RiskMatrixVersion:
        """
        Activate a risk matrix version (sets it as the current version).
        Deactivates all other versions.

        Args:
            version_id: ID of the version to activate

        Returns:
            Activated RiskMatrixVersion
        """
        version = self.db.query(RiskMatrixVersion).filter(
            RiskMatrixVersion.id == version_id
        ).first()

        if not version:
            raise ValueError(f"Risk matrix version {version_id} not found")

        if not version.is_approved:
            raise ValueError(
                f"Cannot activate unapproved version {version.version}. "
                "Approve it first using approve_version()."
            )

        # Deactivate all other versions
        self.db.query(RiskMatrixVersion).update({"is_active": False})

        # Activate this version
        version.is_active = True

        self.db.commit()
        self.db.refresh(version)

        logger.info(f"Activated risk matrix version: {version.version}")
        logger.info("All other versions deactivated")

        return version

    def get_active_version(self) -> Optional[RiskMatrixVersion]:
        """Get the currently active risk matrix version."""
        return self.db.query(RiskMatrixVersion).filter(
            RiskMatrixVersion.is_active == True
        ).first()

    def rollback_to_version(self, version_id: int) -> RiskMatrixVersion:
        """
        Rollback to a previous risk matrix version.

        Args:
            version_id: ID of the version to rollback to

        Returns:
            Activated version
        """
        logger.info(f"Rolling back to version {version_id}...")
        return self.activate_version(version_id)

    def compare_versions(self, version_id_1: int, version_id_2: int) -> Dict:
        """
        Compare two risk matrix versions.

        Returns:
            Dictionary with comparison metrics
        """
        v1 = self.db.query(RiskMatrixVersion).filter(
            RiskMatrixVersion.id == version_id_1
        ).first()
        v2 = self.db.query(RiskMatrixVersion).filter(
            RiskMatrixVersion.id == version_id_2
        ).first()

        if not v1 or not v2:
            raise ValueError("One or both versions not found")

        # Calculate weight differences
        weight_diff = {}
        for cat in self.RISK_CATEGORIES:
            w1 = getattr(v1, f"{cat}_weight")
            w2 = getattr(v2, f"{cat}_weight")
            weight_diff[cat] = {
                "v1": w1,
                "v2": w2,
                "diff": w2 - w1,
                "pct_change": ((w2 - w1) / w1 * 100) if w1 > 0 else 0
            }

        return {
            "version_1": {
                "id": v1.id,
                "version": v1.version,
                "accuracy": v1.model_accuracy,
                "auc": v1.model_auc,
                "is_active": v1.is_active,
            },
            "version_2": {
                "id": v2.id,
                "version": v2.version,
                "accuracy": v2.model_accuracy,
                "auc": v2.model_auc,
                "is_active": v2.is_active,
            },
            "weight_differences": weight_diff,
            "performance_improvement": {
                "accuracy": v2.model_accuracy - v1.model_accuracy if v1.model_accuracy and v2.model_accuracy else None,
                "auc": v2.model_auc - v1.model_auc if v1.model_auc and v2.model_auc else None,
            }
        }
