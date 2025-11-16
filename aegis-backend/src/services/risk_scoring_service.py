"""
Risk Scoring Service - Applies risk weights to compute composite scores.

Uses the currently active risk matrix version to calculate weighted risk scores.
"""
from typing import Dict, Optional, List
from datetime import datetime, timedelta
import logging
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from src.db.models import (
    Supplier, RiskAssessment, RiskMatrixVersion,
    Contract, Alert, AlertSeverity
)

logger = logging.getLogger(__name__)


class RiskScoringService:
    """
    Service for computing composite risk scores using active risk matrix weights.
    """

    RISK_CATEGORIES = [
        "financial", "legal", "esg", "geopolitical",
        "operational", "pricing", "social", "performance"
    ]

    def __init__(self, db: Session):
        self.db = db

    def get_active_weights(self) -> Dict[str, float]:
        """
        Get the currently active risk weights.

        Returns:
            Dictionary mapping risk category to weight
        """
        active_version = self.db.query(RiskMatrixVersion).filter(
            RiskMatrixVersion.is_active == True
        ).first()

        if not active_version:
            # Return default equal weights if no active version
            logger.warning("No active risk matrix version found. Using equal weights.")
            return {cat: 1.0 / len(self.RISK_CATEGORIES) for cat in self.RISK_CATEGORIES}

        weights = {
            "financial": active_version.financial_weight,
            "legal": active_version.legal_weight,
            "esg": active_version.esg_weight,
            "geopolitical": active_version.geopolitical_weight,
            "operational": active_version.operational_weight,
            "pricing": active_version.pricing_weight,
            "social": active_version.social_weight,
            "performance": active_version.performance_weight,
        }

        logger.debug(f"Using weights from version: {active_version.version}")
        return weights

    def compute_composite_score(
        self,
        category_scores: Dict[str, float],
        weights: Optional[Dict[str, float]] = None
    ) -> float:
        """
        Compute weighted composite risk score.

        Args:
            category_scores: Dictionary of risk category scores (0-100)
            weights: Optional custom weights (uses active weights if not provided)

        Returns:
            Composite score (0-100)
        """
        if weights is None:
            weights = self.get_active_weights()

        composite_score = 0.0
        for category in self.RISK_CATEGORIES:
            score = category_scores.get(f"{category}_score", 0.0)
            weight = weights.get(category, 0.0)
            composite_score += score * weight

        return round(composite_score, 2)

    def create_risk_assessment(
        self,
        supplier_id: int,
        category_scores: Dict[str, float],
        contract_id: Optional[int] = None,
        confidence_level: Optional[float] = None,
        recommendation: Optional[str] = None,
        recommendation_rationale: Optional[str] = None,
        risk_factors: Optional[Dict] = None,
        agent_type: Optional[str] = None
    ) -> RiskAssessment:
        """
        Create a new risk assessment with computed composite score.

        Args:
            supplier_id: Supplier ID
            category_scores: Dictionary with individual risk scores
            contract_id: Optional contract ID
            confidence_level: Confidence level (0-1)
            recommendation: "Proceed", "Negotiate", or "Replace"
            recommendation_rationale: Explanation for recommendation
            risk_factors: Detailed risk factors
            agent_type: Type of agent that created this assessment

        Returns:
            Created RiskAssessment object
        """
        # Get active weights and version
        active_version = self.db.query(RiskMatrixVersion).filter(
            RiskMatrixVersion.is_active == True
        ).first()

        weights = self.get_active_weights()
        composite_score = self.compute_composite_score(category_scores, weights)

        # Determine recommendation if not provided
        if recommendation is None:
            if composite_score < 40:
                recommendation = "Proceed"
            elif composite_score < 70:
                recommendation = "Negotiate"
            else:
                recommendation = "Replace"

        # Create assessment
        assessment = RiskAssessment(
            supplier_id=supplier_id,
            contract_id=contract_id,
            financial_score=category_scores.get("financial_score", 0.0),
            legal_score=category_scores.get("legal_score", 0.0),
            esg_score=category_scores.get("esg_score", 0.0),
            geopolitical_score=category_scores.get("geopolitical_score", 0.0),
            operational_score=category_scores.get("operational_score", 0.0),
            pricing_score=category_scores.get("pricing_score", 0.0),
            social_score=category_scores.get("social_score", 0.0),
            performance_score=category_scores.get("performance_score", 0.0),
            composite_score=composite_score,
            confidence_level=confidence_level,
            risk_matrix_version=active_version.version if active_version else "default",
            assessed_by_agent=True,
            agent_type=agent_type,
            recommendation=recommendation,
            recommendation_rationale=recommendation_rationale,
            risk_factors=risk_factors,
        )

        self.db.add(assessment)
        self.db.commit()
        self.db.refresh(assessment)

        logger.info(f"Created risk assessment for supplier {supplier_id}: {composite_score:.2f}")

        # Generate alerts if score is critical
        if composite_score >= 80:
            self._create_risk_alert(assessment, AlertSeverity.CRITICAL)
        elif composite_score >= 60:
            self._create_risk_alert(assessment, AlertSeverity.WARNING)

        return assessment

    def _create_risk_alert(self, assessment: RiskAssessment, severity: AlertSeverity):
        """Create an alert for high risk assessment."""
        supplier = self.db.query(Supplier).filter(Supplier.id == assessment.supplier_id).first()

        if not supplier:
            return

        alert = Alert(
            supplier_id=supplier.id,
            title=f"High Risk Detected: {supplier.name}",
            message=f"Risk score of {assessment.composite_score:.1f} detected. "
                    f"Recommendation: {assessment.recommendation}. "
                    f"{assessment.recommendation_rationale or ''}",
            severity=severity,
            category="Risk Assessment",
            source="agent",
            source_agent=assessment.agent_type,
            data={
                "assessment_id": assessment.id,
                "composite_score": assessment.composite_score,
                "recommendation": assessment.recommendation,
            }
        )

        self.db.add(alert)
        self.db.commit()
        logger.info(f"Created {severity.value} alert for supplier {supplier.name}")

    def get_latest_assessment(self, supplier_id: int) -> Optional[RiskAssessment]:
        """Get the most recent risk assessment for a supplier."""
        return (
            self.db.query(RiskAssessment)
            .filter(RiskAssessment.supplier_id == supplier_id)
            .order_by(RiskAssessment.assessed_at.desc())
            .first()
        )

    def get_risk_trend(
        self,
        supplier_id: int,
        days: int = 90
    ) -> List[Dict]:
        """
        Get risk score trend over time for a supplier.

        Args:
            supplier_id: Supplier ID
            days: Number of days to look back

        Returns:
            List of {date, composite_score} dictionaries
        """
        cutoff_date = datetime.now() - timedelta(days=days)

        assessments = (
            self.db.query(RiskAssessment)
            .filter(
                and_(
                    RiskAssessment.supplier_id == supplier_id,
                    RiskAssessment.assessed_at >= cutoff_date
                )
            )
            .order_by(RiskAssessment.assessed_at.asc())
            .all()
        )

        return [
            {
                "date": a.assessed_at.isoformat(),
                "composite_score": a.composite_score,
                "confidence_level": a.confidence_level,
            }
            for a in assessments
        ]

    def get_category_breakdown(self, supplier_id: int) -> Optional[Dict]:
        """
        Get the latest risk category breakdown for a supplier.

        Returns:
            Dictionary with individual category scores and weights
        """
        assessment = self.get_latest_assessment(supplier_id)

        if not assessment:
            return None

        weights = self.get_active_weights()

        breakdown = {}
        for category in self.RISK_CATEGORIES:
            score = getattr(assessment, f"{category}_score")
            weight = weights.get(category, 0.0)
            weighted_contribution = score * weight

            breakdown[category] = {
                "score": score,
                "weight": weight,
                "weighted_contribution": weighted_contribution,
            }

        return {
            "composite_score": assessment.composite_score,
            "assessed_at": assessment.assessed_at.isoformat(),
            "categories": breakdown,
            "recommendation": assessment.recommendation,
        }

    def compare_suppliers(
        self,
        supplier_ids: List[int]
    ) -> List[Dict]:
        """
        Compare risk scores across multiple suppliers.

        Args:
            supplier_ids: List of supplier IDs to compare

        Returns:
            List of supplier risk comparisons
        """
        results = []

        for supplier_id in supplier_ids:
            supplier = self.db.query(Supplier).filter(Supplier.id == supplier_id).first()
            assessment = self.get_latest_assessment(supplier_id)

            if supplier and assessment:
                results.append({
                    "supplier_id": supplier.id,
                    "supplier_name": supplier.name,
                    "composite_score": assessment.composite_score,
                    "recommendation": assessment.recommendation,
                    "assessed_at": assessment.assessed_at.isoformat(),
                    "category_scores": {
                        cat: getattr(assessment, f"{cat}_score")
                        for cat in self.RISK_CATEGORIES
                    }
                })

        # Sort by composite score (highest risk first)
        results.sort(key=lambda x: x["composite_score"], reverse=True)

        return results

    def get_portfolio_statistics(self) -> Dict:
        """
        Get aggregate risk statistics across entire supplier portfolio.

        Returns:
            Dictionary with portfolio-level risk metrics
        """
        # Get latest assessment for each supplier
        latest_assessments = (
            self.db.query(
                RiskAssessment.supplier_id,
                func.max(RiskAssessment.assessed_at).label("max_date")
            )
            .group_by(RiskAssessment.supplier_id)
            .subquery()
        )

        assessments = (
            self.db.query(RiskAssessment)
            .join(
                latest_assessments,
                and_(
                    RiskAssessment.supplier_id == latest_assessments.c.supplier_id,
                    RiskAssessment.assessed_at == latest_assessments.c.max_date
                )
            )
            .all()
        )

        if not assessments:
            return {
                "total_suppliers": 0,
                "average_risk": 0.0,
                "high_risk_count": 0,
                "medium_risk_count": 0,
                "low_risk_count": 0,
            }

        scores = [a.composite_score for a in assessments]

        return {
            "total_suppliers": len(scores),
            "average_risk": round(sum(scores) / len(scores), 2),
            "min_risk": min(scores),
            "max_risk": max(scores),
            "high_risk_count": len([s for s in scores if s >= 70]),
            "medium_risk_count": len([s for s in scores if 40 <= s < 70]),
            "low_risk_count": len([s for s in scores if s < 40]),
            "risk_distribution": {
                "0-20": len([s for s in scores if s < 20]),
                "20-40": len([s for s in scores if 20 <= s < 40]),
                "40-60": len([s for s in scores if 40 <= s < 60]),
                "60-80": len([s for s in scores if 60 <= s < 80]),
                "80-100": len([s for s in scores if s >= 80]),
            }
        }
