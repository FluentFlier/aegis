"""
Analytics API endpoints - Portfolio statistics, trends, and KPIs.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from pydantic import BaseModel

from src.db.database import get_db
from src.db.models import Supplier, RiskAssessment, Alert, Contract, SupplierStatus
from src.services.risk_scoring_service import RiskScoringService

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/portfolio/summary")
async def get_portfolio_summary(db: Session = Depends(get_db)):
    """
    Get overall portfolio summary statistics.

    Returns key metrics for the executive dashboard.
    """
    risk_service = RiskScoringService(db)

    # Get portfolio-level statistics
    portfolio_stats = risk_service.get_portfolio_statistics()

    # Total suppliers
    total_suppliers = db.query(func.count(Supplier.id)).scalar()

    # Suppliers by status
    active_suppliers = db.query(func.count(Supplier.id)).filter(
        Supplier.status == SupplierStatus.ACTIVE
    ).scalar()

    critical_suppliers = db.query(func.count(Supplier.id)).filter(
        Supplier.status == SupplierStatus.CRITICAL
    ).scalar()

    under_review_suppliers = db.query(func.count(Supplier.id)).filter(
        Supplier.status == SupplierStatus.UNDER_REVIEW
    ).scalar()

    # Total contract value
    total_contract_value = db.query(func.sum(Contract.contract_value)).filter(
        Contract.status == "active"
    ).scalar() or 0

    # Unresolved critical alerts
    critical_alerts = db.query(func.count(Alert.id)).filter(
        and_(Alert.severity == "critical", Alert.is_resolved == False)
    ).scalar()

    return {
        "total_suppliers": total_suppliers,
        "active_suppliers": active_suppliers,
        "critical_suppliers": critical_suppliers,
        "under_review_suppliers": under_review_suppliers,
        "total_contract_value": total_contract_value,
        "critical_alerts": critical_alerts,
        "average_risk_score": portfolio_stats.get("average_risk", 0),
        "risk_distribution": portfolio_stats.get("risk_distribution", {}),
        "high_risk_suppliers": portfolio_stats.get("high_risk_count", 0),
        "medium_risk_suppliers": portfolio_stats.get("medium_risk_count", 0),
        "low_risk_suppliers": portfolio_stats.get("low_risk_count", 0),
    }


@router.get("/risk-distribution")
async def get_risk_distribution(db: Session = Depends(get_db)):
    """
    Get risk score distribution across all suppliers.

    Returns histogram data for visualization.
    """
    risk_service = RiskScoringService(db)
    portfolio_stats = risk_service.get_portfolio_statistics()

    return {
        "distribution": portfolio_stats.get("risk_distribution", {}),
        "total_suppliers": portfolio_stats.get("total_suppliers", 0),
        "average_risk": portfolio_stats.get("average_risk", 0),
        "min_risk": portfolio_stats.get("min_risk", 0),
        "max_risk": portfolio_stats.get("max_risk", 0),
    }


@router.get("/risk-by-region")
async def get_risk_by_region(db: Session = Depends(get_db)):
    """
    Get average risk scores grouped by region.
    """
    # Get latest assessment for each supplier
    latest_assessments_subquery = (
        db.query(
            RiskAssessment.supplier_id,
            func.max(RiskAssessment.assessed_at).label("max_date")
        )
        .group_by(RiskAssessment.supplier_id)
        .subquery()
    )

    # Join with suppliers to get regions
    regional_stats = (
        db.query(
            Supplier.region,
            func.count(Supplier.id).label("supplier_count"),
            func.avg(RiskAssessment.composite_score).label("avg_risk")
        )
        .join(
            RiskAssessment,
            Supplier.id == RiskAssessment.supplier_id
        )
        .join(
            latest_assessments_subquery,
            and_(
                RiskAssessment.supplier_id == latest_assessments_subquery.c.supplier_id,
                RiskAssessment.assessed_at == latest_assessments_subquery.c.max_date
            )
        )
        .filter(Supplier.region.isnot(None))
        .group_by(Supplier.region)
        .all()
    )

    return [
        {
            "region": stat.region,
            "supplier_count": stat.supplier_count,
            "average_risk": round(float(stat.avg_risk), 2) if stat.avg_risk else 0,
        }
        for stat in regional_stats
    ]


@router.get("/risk-by-category")
async def get_risk_by_category(db: Session = Depends(get_db)):
    """
    Get average risk scores grouped by supplier category.
    """
    # Get latest assessment for each supplier
    latest_assessments_subquery = (
        db.query(
            RiskAssessment.supplier_id,
            func.max(RiskAssessment.assessed_at).label("max_date")
        )
        .group_by(RiskAssessment.supplier_id)
        .subquery()
    )

    # Join with suppliers to get categories
    category_stats = (
        db.query(
            Supplier.category,
            func.count(Supplier.id).label("supplier_count"),
            func.avg(RiskAssessment.composite_score).label("avg_risk")
        )
        .join(
            RiskAssessment,
            Supplier.id == RiskAssessment.supplier_id
        )
        .join(
            latest_assessments_subquery,
            and_(
                RiskAssessment.supplier_id == latest_assessments_subquery.c.supplier_id,
                RiskAssessment.assessed_at == latest_assessments_subquery.c.max_date
            )
        )
        .filter(Supplier.category.isnot(None))
        .group_by(Supplier.category)
        .all()
    )

    return [
        {
            "category": stat.category,
            "supplier_count": stat.supplier_count,
            "average_risk": round(float(stat.avg_risk), 2) if stat.avg_risk else 0,
        }
        for stat in category_stats
    ]


@router.get("/risk-trends")
async def get_risk_trends(
    days: int = Query(90, ge=7, le=365),
    db: Session = Depends(get_db)
):
    """
    Get portfolio-wide risk trend over time.

    Returns daily average risk scores.
    """
    cutoff_date = datetime.now() - timedelta(days=days)

    # Get all assessments within the time period
    assessments = (
        db.query(
            func.date(RiskAssessment.assessed_at).label("date"),
            func.avg(RiskAssessment.composite_score).label("avg_risk"),
            func.count(RiskAssessment.id).label("assessment_count")
        )
        .filter(RiskAssessment.assessed_at >= cutoff_date)
        .group_by(func.date(RiskAssessment.assessed_at))
        .order_by(func.date(RiskAssessment.assessed_at).asc())
        .all()
    )

    return {
        "period_days": days,
        "data_points": len(assessments),
        "trend": [
            {
                "date": assessment.date.isoformat(),
                "average_risk": round(float(assessment.avg_risk), 2),
                "assessment_count": assessment.assessment_count,
            }
            for assessment in assessments
        ]
    }


@router.get("/top-risks")
async def get_top_risks(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Get suppliers with highest risk scores.
    """
    risk_service = RiskScoringService(db)

    # Get all suppliers
    suppliers = db.query(Supplier).all()

    # Get latest assessments and sort by risk
    supplier_risks = []
    for supplier in suppliers:
        latest_assessment = risk_service.get_latest_assessment(supplier.id)
        if latest_assessment:
            supplier_risks.append({
                "supplier_id": supplier.id,
                "supplier_name": supplier.name,
                "region": supplier.region,
                "status": supplier.status.value,
                "composite_score": latest_assessment.composite_score,
                "recommendation": latest_assessment.recommendation,
                "assessed_at": latest_assessment.assessed_at.isoformat(),
            })

    # Sort by risk score (highest first) and return top N
    supplier_risks.sort(key=lambda x: x["composite_score"], reverse=True)

    return supplier_risks[:limit]


@router.get("/contract-outcomes")
async def get_contract_outcomes(db: Session = Depends(get_db)):
    """
    Get distribution of contract outcomes.

    Critical for ML training data analysis.
    """
    outcomes = (
        db.query(
            Contract.outcome,
            func.count(Contract.id).label("count"),
            func.sum(Contract.loss_amount).label("total_loss")
        )
        .filter(Contract.outcome.isnot(None))
        .group_by(Contract.outcome)
        .all()
    )

    total_contracts = sum(outcome.count for outcome in outcomes)

    return {
        "total_contracts_with_outcomes": total_contracts,
        "outcomes": [
            {
                "outcome": outcome.outcome.value,
                "count": outcome.count,
                "percentage": round((outcome.count / total_contracts * 100) if total_contracts > 0 else 0, 2),
                "total_loss": float(outcome.total_loss) if outcome.total_loss else 0,
            }
            for outcome in outcomes
        ]
    }


@router.get("/agent-activity")
async def get_agent_activity(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """
    Get agent activity statistics.
    """
    from src.db.models import AgentActivity

    cutoff_date = datetime.now() - timedelta(days=days)

    # Activity by agent type
    activity_stats = (
        db.query(
            AgentActivity.agent_type,
            func.count(AgentActivity.id).label("total_tasks"),
            func.sum(func.case((AgentActivity.status == "completed", 1), else_=0)).label("completed_tasks"),
            func.sum(func.case((AgentActivity.status == "failed", 1), else_=0)).label("failed_tasks"),
        )
        .filter(AgentActivity.started_at >= cutoff_date)
        .group_by(AgentActivity.agent_type)
        .all()
    )

    return {
        "period_days": days,
        "agent_stats": [
            {
                "agent_type": stat.agent_type.value,
                "total_tasks": stat.total_tasks,
                "completed_tasks": stat.completed_tasks,
                "failed_tasks": stat.failed_tasks,
                "success_rate": round((stat.completed_tasks / stat.total_tasks * 100) if stat.total_tasks > 0 else 0, 2),
            }
            for stat in activity_stats
        ]
    }


@router.get("/esg-compliance")
async def get_esg_compliance(db: Session = Depends(get_db)):
    """
    Get ESG compliance statistics across suppliers.
    """
    # Get latest assessments
    latest_assessments_subquery = (
        db.query(
            RiskAssessment.supplier_id,
            func.max(RiskAssessment.assessed_at).label("max_date")
        )
        .group_by(RiskAssessment.supplier_id)
        .subquery()
    )

    assessments = (
        db.query(RiskAssessment)
        .join(
            latest_assessments_subquery,
            and_(
                RiskAssessment.supplier_id == latest_assessments_subquery.c.supplier_id,
                RiskAssessment.assessed_at == latest_assessments_subquery.c.max_date
            )
        )
        .all()
    )

    if not assessments:
        return {
            "total_suppliers": 0,
            "average_esg_score": 0,
            "compliance_levels": {
                "excellent": 0,
                "good": 0,
                "moderate": 0,
                "poor": 0,
            }
        }

    esg_scores = [a.esg_score for a in assessments]
    avg_esg = sum(esg_scores) / len(esg_scores)

    # Categorize compliance levels (inverted - lower score = better)
    excellent = len([s for s in esg_scores if s < 20])
    good = len([s for s in esg_scores if 20 <= s < 40])
    moderate = len([s for s in esg_scores if 40 <= s < 60])
    poor = len([s for s in esg_scores if s >= 60])

    return {
        "total_suppliers": len(esg_scores),
        "average_esg_score": round(avg_esg, 2),
        "compliance_levels": {
            "excellent": excellent,
            "good": good,
            "moderate": moderate,
            "poor": poor,
        }
    }
