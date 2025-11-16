"""
ML Model Management API - Control adaptive risk weight learning system.

This API enables the CPO and system admins to:
1. Train new risk models from contract outcomes
2. Review and approve new risk weight versions
3. Activate/rollback risk matrix versions
4. Compare model performance
5. View feature importance evolution
"""
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from src.db.database import get_db
from src.db.models import RiskMatrixVersion
from src.services.ml_training_service import MLTrainingService

router = APIRouter(prefix="/api/ml-models", tags=["ml-models"])


# Pydantic schemas
class TrainModelRequest(BaseModel):
    model_type: str = "logistic_regression"  # logistic_regression, random_forest, gradient_boosting
    description: Optional[str] = None
    auto_approve: Optional[bool] = None


class RiskMatrixVersionResponse(BaseModel):
    id: int
    version: str
    is_active: bool
    is_approved: bool
    created_at: datetime
    approved_at: Optional[datetime]
    trained_on_samples: Optional[int]
    model_accuracy: Optional[float]
    model_auc: Optional[float]
    model_type: Optional[str]
    description: Optional[str]

    # Risk weights
    financial_weight: float
    legal_weight: float
    esg_weight: float
    geopolitical_weight: float
    operational_weight: float
    pricing_weight: float
    social_weight: float
    performance_weight: float

    class Config:
        from_attributes = True


@router.get("/versions", response_model=List[RiskMatrixVersionResponse])
async def list_risk_matrix_versions(
    is_active: Optional[bool] = None,
    is_approved: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    List all risk matrix versions with optional filtering.

    Shows the evolution of risk weights over time.
    """
    query = db.query(RiskMatrixVersion)

    if is_active is not None:
        query = query.filter(RiskMatrixVersion.is_active == is_active)
    if is_approved is not None:
        query = query.filter(RiskMatrixVersion.is_approved == is_approved)

    versions = (
        query.order_by(desc(RiskMatrixVersion.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [
        {
            "id": v.id,
            "version": v.version,
            "is_active": v.is_active,
            "is_approved": v.is_approved,
            "created_at": v.created_at,
            "approved_at": v.approved_at,
            "trained_on_samples": v.trained_on_samples,
            "model_accuracy": v.model_accuracy,
            "model_auc": v.model_auc,
            "model_type": v.model_type,
            "description": v.description,
            "financial_weight": v.financial_weight,
            "legal_weight": v.legal_weight,
            "esg_weight": v.esg_weight,
            "geopolitical_weight": v.geopolitical_weight,
            "operational_weight": v.operational_weight,
            "pricing_weight": v.pricing_weight,
            "social_weight": v.social_weight,
            "performance_weight": v.performance_weight,
        }
        for v in versions
    ]


@router.get("/versions/active", response_model=RiskMatrixVersionResponse)
async def get_active_version(db: Session = Depends(get_db)):
    """
    Get the currently active risk matrix version.

    This version's weights are being used for all risk assessments.
    """
    ml_service = MLTrainingService(db)
    active_version = ml_service.get_active_version()

    if not active_version:
        raise HTTPException(status_code=404, detail="No active risk matrix version found")

    return {
        "id": active_version.id,
        "version": active_version.version,
        "is_active": active_version.is_active,
        "is_approved": active_version.is_approved,
        "created_at": active_version.created_at,
        "approved_at": active_version.approved_at,
        "trained_on_samples": active_version.trained_on_samples,
        "model_accuracy": active_version.model_accuracy,
        "model_auc": active_version.model_auc,
        "model_type": active_version.model_type,
        "description": active_version.description,
        "financial_weight": active_version.financial_weight,
        "legal_weight": active_version.legal_weight,
        "esg_weight": active_version.esg_weight,
        "geopolitical_weight": active_version.geopolitical_weight,
        "operational_weight": active_version.operational_weight,
        "pricing_weight": active_version.pricing_weight,
        "social_weight": active_version.social_weight,
        "performance_weight": active_version.performance_weight,
    }


@router.get("/versions/{version_id}", response_model=RiskMatrixVersionResponse)
async def get_version(version_id: int, db: Session = Depends(get_db)):
    """Get a specific risk matrix version."""
    version = db.query(RiskMatrixVersion).filter(RiskMatrixVersion.id == version_id).first()

    if not version:
        raise HTTPException(status_code=404, detail="Risk matrix version not found")

    return {
        "id": version.id,
        "version": version.version,
        "is_active": version.is_active,
        "is_approved": version.is_approved,
        "created_at": version.created_at,
        "approved_at": version.approved_at,
        "trained_on_samples": version.trained_on_samples,
        "model_accuracy": version.model_accuracy,
        "model_auc": version.model_auc,
        "model_type": version.model_type,
        "description": version.description,
        "financial_weight": version.financial_weight,
        "legal_weight": version.legal_weight,
        "esg_weight": version.esg_weight,
        "geopolitical_weight": version.geopolitical_weight,
        "operational_weight": version.operational_weight,
        "pricing_weight": version.pricing_weight,
        "social_weight": version.social_weight,
        "performance_weight": version.performance_weight,
    }


@router.post("/train")
async def train_new_model(
    request: TrainModelRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Train a new ML model to learn optimal risk weights from contract outcomes.

    This is the core adaptive learning functionality. The model:
    1. Analyzes historical contracts and their outcomes
    2. Learns which risk categories predict bad outcomes
    3. Generates new weights based on feature importance
    4. Creates a new risk matrix version for approval

    **Process:**
    - Training happens in background
    - New version requires approval before activation (unless auto_approve=True)
    - All versions are versioned and can be rolled back
    """
    ml_service = MLTrainingService(db)

    try:
        # Train model
        training_results = ml_service.train_model(model_type=request.model_type)

        # Create new risk matrix version
        new_version = ml_service.create_risk_matrix_version(
            training_results=training_results,
            description=request.description,
            auto_approve=request.auto_approve
        )

        return {
            "status": "success",
            "message": "Model trained successfully",
            "version_id": new_version.id,
            "version": new_version.version,
            "is_approved": new_version.is_approved,
            "is_active": new_version.is_active,
            "training_results": {
                "model_type": training_results["model_type"],
                "n_samples": training_results["n_samples"],
                "accuracy": training_results["accuracy"],
                "auc": training_results["auc"],
                "feature_importance": training_results["feature_importance"],
            },
            "next_steps": (
                "Version is active and in use" if new_version.is_active
                else "Version requires approval" if not new_version.is_approved
                else "Version approved, activate to use"
            )
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@router.post("/versions/{version_id}/approve")
async def approve_version(version_id: int, db: Session = Depends(get_db)):
    """
    Approve a risk matrix version (human-in-the-loop governance).

    **Requires:** CPO or admin role (to be implemented with auth)

    Approved versions can then be activated to replace the current weights.
    """
    ml_service = MLTrainingService(db)

    try:
        approved_version = ml_service.approve_version(version_id)

        return {
            "status": "success",
            "message": f"Version {approved_version.version} approved",
            "version_id": approved_version.id,
            "approved_at": approved_version.approved_at.isoformat(),
            "next_step": "Activate this version to use it for risk assessments"
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/versions/{version_id}/activate")
async def activate_version(version_id: int, db: Session = Depends(get_db)):
    """
    Activate a risk matrix version (make it the current version).

    **Important:** This immediately changes how risk scores are calculated!

    The activated version's weights will be used for all new risk assessments.
    Deactivates all other versions automatically.
    """
    ml_service = MLTrainingService(db)

    try:
        activated_version = ml_service.activate_version(version_id)

        return {
            "status": "success",
            "message": f"Version {activated_version.version} is now active",
            "version_id": activated_version.id,
            "version": activated_version.version,
            "weights": {
                "financial": activated_version.financial_weight,
                "legal": activated_version.legal_weight,
                "esg": activated_version.esg_weight,
                "geopolitical": activated_version.geopolitical_weight,
                "operational": activated_version.operational_weight,
                "pricing": activated_version.pricing_weight,
                "social": activated_version.social_weight,
                "performance": activated_version.performance_weight,
            }
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/versions/{version_id}/rollback")
async def rollback_to_version(version_id: int, db: Session = Depends(get_db)):
    """
    Rollback to a previous risk matrix version.

    Use this if a new version performs poorly or causes issues.
    """
    ml_service = MLTrainingService(db)

    try:
        rolled_back_version = ml_service.rollback_to_version(version_id)

        return {
            "status": "success",
            "message": f"Rolled back to version {rolled_back_version.version}",
            "version_id": rolled_back_version.id,
            "version": rolled_back_version.version,
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/versions/compare")
async def compare_versions(
    version_1_id: int = Query(..., description="First version ID"),
    version_2_id: int = Query(..., description="Second version ID"),
    db: Session = Depends(get_db)
):
    """
    Compare two risk matrix versions.

    Shows:
    - Weight differences across all categories
    - Performance metrics comparison
    - Percentage changes

    Useful for validating new models before activation.
    """
    ml_service = MLTrainingService(db)

    try:
        comparison = ml_service.compare_versions(version_1_id, version_2_id)
        return comparison

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/weight-evolution")
async def get_weight_evolution(
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get the evolution of risk weights over time.

    Visualizes how the ML system has learned and adapted weights.

    If category is specified, shows evolution for that category only.
    Otherwise, shows all categories.
    """
    versions = (
        db.query(RiskMatrixVersion)
        .filter(RiskMatrixVersion.is_approved == True)
        .order_by(RiskMatrixVersion.created_at.asc())
        .all()
    )

    categories = [
        "financial", "legal", "esg", "geopolitical",
        "operational", "pricing", "social", "performance"
    ]

    if category:
        if category not in categories:
            raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {categories}")
        categories = [category]

    evolution = {cat: [] for cat in categories}

    for version in versions:
        for cat in categories:
            weight = getattr(version, f"{cat}_weight")
            evolution[cat].append({
                "version": version.version,
                "date": version.created_at.isoformat(),
                "weight": weight,
                "is_active": version.is_active,
                "model_accuracy": version.model_accuracy,
                "model_auc": version.model_auc,
            })

    return {
        "total_versions": len(versions),
        "categories": categories,
        "evolution": evolution
    }


@router.get("/training-readiness")
async def check_training_readiness(db: Session = Depends(get_db)):
    """
    Check if there's enough data to train a new model.

    Returns:
    - Number of contracts with outcomes
    - Whether minimum threshold is met
    - Outcome distribution
    - Recommendation on whether to train
    """
    from src.db.models import Contract
    from src.config import settings

    # Count contracts with outcomes
    total_contracts = db.query(func.count(Contract.id)).filter(
        Contract.outcome.isnot(None)
    ).scalar()

    # Get outcome distribution
    from sqlalchemy import func
    outcomes = (
        db.query(Contract.outcome, func.count(Contract.id))
        .filter(Contract.outcome.isnot(None))
        .group_by(Contract.outcome)
        .all()
    )

    outcome_distribution = {outcome[0].value: outcome[1] for outcome in outcomes}

    min_required = settings.ML_MODEL_MIN_SAMPLES
    is_ready = total_contracts >= min_required

    return {
        "is_ready": is_ready,
        "total_contracts_with_outcomes": total_contracts,
        "minimum_required": min_required,
        "outcome_distribution": outcome_distribution,
        "recommendation": (
            "Ready to train! Sufficient data available." if is_ready
            else f"Need {min_required - total_contracts} more contracts with outcomes before training."
        )
    }
