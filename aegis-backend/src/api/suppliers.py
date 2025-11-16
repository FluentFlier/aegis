"""
Supplier API endpoints - Complete CRUD operations, filtering, search, and risk assessment.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from src.db.database import get_db
from src.db.models import Supplier, RiskAssessment, SupplierStatus
from src.services.risk_scoring_service import RiskScoringService
from src.agents.orchestrator import AegisOrchestrator

router = APIRouter(prefix="/api/suppliers", tags=["suppliers"])


# Pydantic schemas
class SupplierCreate(BaseModel):
    name: str
    status: SupplierStatus = SupplierStatus.PENDING
    region: Optional[str] = None
    country: Optional[str] = None
    category: Optional[str] = None
    annual_volume: Optional[float] = None
    currency: str = "USD"
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[SupplierStatus] = None
    region: Optional[str] = None
    country: Optional[str] = None
    category: Optional[str] = None
    annual_volume: Optional[float] = None
    currency: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None


class SupplierResponse(BaseModel):
    id: int
    name: str
    status: str
    region: Optional[str]
    country: Optional[str]
    category: Optional[str]
    annual_volume: Optional[float]
    currency: str
    contact_name: Optional[str]
    contact_email: Optional[str]
    contact_phone: Optional[str]
    description: Optional[str]
    tags: Optional[List]
    created_at: datetime
    updated_at: Optional[datetime]
    last_assessment_date: Optional[datetime]

    # Include latest risk assessment
    latest_risk_score: Optional[float] = None
    risk_trend: Optional[str] = None  # "up", "down", "stable"

    class Config:
        from_attributes = True


@router.get("/", response_model=List[SupplierResponse])
async def list_suppliers(
    status: Optional[SupplierStatus] = None,
    region: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    min_risk: Optional[float] = None,
    max_risk: Optional[float] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    List suppliers with optional filtering and search.

    Filters:
    - status: Supplier status (Active, Critical, etc.)
    - region: Geographic region
    - category: Supplier category
    - search: Text search in name/description
    - min_risk/max_risk: Filter by latest risk score
    """
    query = db.query(Supplier)

    # Apply filters
    if status:
        query = query.filter(Supplier.status == status)
    if region:
        query = query.filter(Supplier.region == region)
    if category:
        query = query.filter(Supplier.category == category)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Supplier.name.ilike(search_pattern),
                Supplier.description.ilike(search_pattern)
            )
        )

    suppliers = query.offset(skip).limit(limit).all()

    # Enrich with risk data
    risk_service = RiskScoringService(db)
    results = []

    for supplier in suppliers:
        latest_assessment = risk_service.get_latest_assessment(supplier.id)

        # Apply risk filtering
        if latest_assessment:
            if min_risk is not None and latest_assessment.composite_score < min_risk:
                continue
            if max_risk is not None and latest_assessment.composite_score > max_risk:
                continue

        supplier_dict = {
            "id": supplier.id,
            "name": supplier.name,
            "status": supplier.status.value,
            "region": supplier.region,
            "country": supplier.country,
            "category": supplier.category,
            "annual_volume": supplier.annual_volume,
            "currency": supplier.currency,
            "contact_name": supplier.contact_name,
            "contact_email": supplier.contact_email,
            "contact_phone": supplier.contact_phone,
            "description": supplier.description,
            "tags": supplier.tags,
            "created_at": supplier.created_at,
            "updated_at": supplier.updated_at,
            "last_assessment_date": supplier.last_assessment_date,
        }

        if latest_assessment:
            supplier_dict["latest_risk_score"] = latest_assessment.composite_score

            # Calculate trend
            trend_data = risk_service.get_risk_trend(supplier.id, days=30)
            if len(trend_data) >= 2:
                recent_score = trend_data[-1]["composite_score"]
                older_score = trend_data[0]["composite_score"]
                if recent_score > older_score + 5:
                    supplier_dict["risk_trend"] = "up"
                elif recent_score < older_score - 5:
                    supplier_dict["risk_trend"] = "down"
                else:
                    supplier_dict["risk_trend"] = "stable"

        results.append(supplier_dict)

    return results


@router.get("/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    """Get detailed supplier information."""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()

    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    # Enrich with risk data
    risk_service = RiskScoringService(db)
    latest_assessment = risk_service.get_latest_assessment(supplier.id)

    supplier_dict = {
        "id": supplier.id,
        "name": supplier.name,
        "status": supplier.status.value,
        "region": supplier.region,
        "country": supplier.country,
        "category": supplier.category,
        "annual_volume": supplier.annual_volume,
        "currency": supplier.currency,
        "contact_name": supplier.contact_name,
        "contact_email": supplier.contact_email,
        "contact_phone": supplier.contact_phone,
        "description": supplier.description,
        "tags": supplier.tags,
        "created_at": supplier.created_at,
        "updated_at": supplier.updated_at,
        "last_assessment_date": supplier.last_assessment_date,
    }

    if latest_assessment:
        supplier_dict["latest_risk_score"] = latest_assessment.composite_score

        # Calculate trend
        trend_data = risk_service.get_risk_trend(supplier.id, days=30)
        if len(trend_data) >= 2:
            recent_score = trend_data[-1]["composite_score"]
            older_score = trend_data[0]["composite_score"]
            if recent_score > older_score + 5:
                supplier_dict["risk_trend"] = "up"
            elif recent_score < older_score - 5:
                supplier_dict["risk_trend"] = "down"
            else:
                supplier_dict["risk_trend"] = "stable"

    return supplier_dict


@router.post("/", response_model=SupplierResponse)
async def create_supplier(supplier: SupplierCreate, db: Session = Depends(get_db)):
    """Create a new supplier."""
    new_supplier = Supplier(
        **supplier.model_dump()
    )

    db.add(new_supplier)
    db.commit()
    db.refresh(new_supplier)

    return {
        "id": new_supplier.id,
        "name": new_supplier.name,
        "status": new_supplier.status.value,
        "region": new_supplier.region,
        "country": new_supplier.country,
        "category": new_supplier.category,
        "annual_volume": new_supplier.annual_volume,
        "currency": new_supplier.currency,
        "contact_name": new_supplier.contact_name,
        "contact_email": new_supplier.contact_email,
        "contact_phone": new_supplier.contact_phone,
        "description": new_supplier.description,
        "tags": new_supplier.tags,
        "created_at": new_supplier.created_at,
        "updated_at": new_supplier.updated_at,
        "last_assessment_date": new_supplier.last_assessment_date,
    }


@router.put("/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(
    supplier_id: int,
    supplier_update: SupplierUpdate,
    db: Session = Depends(get_db)
):
    """Update supplier information."""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()

    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    # Update fields
    update_data = supplier_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(supplier, field, value)

    supplier.updated_at = datetime.now()
    db.commit()
    db.refresh(supplier)

    return {
        "id": supplier.id,
        "name": supplier.name,
        "status": supplier.status.value,
        "region": supplier.region,
        "country": supplier.country,
        "category": supplier.category,
        "annual_volume": supplier.annual_volume,
        "currency": supplier.currency,
        "contact_name": supplier.contact_name,
        "contact_email": supplier.contact_email,
        "contact_phone": supplier.contact_phone,
        "description": supplier.description,
        "tags": supplier.tags,
        "created_at": supplier.created_at,
        "updated_at": supplier.updated_at,
        "last_assessment_date": supplier.last_assessment_date,
    }


@router.delete("/{supplier_id}")
async def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    """Delete a supplier."""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()

    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    db.delete(supplier)
    db.commit()

    return {"status": "success", "message": f"Supplier {supplier_id} deleted"}


@router.get("/{supplier_id}/risk-breakdown")
async def get_risk_breakdown(supplier_id: int, db: Session = Depends(get_db)):
    """Get detailed risk category breakdown for a supplier."""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()

    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    risk_service = RiskScoringService(db)
    breakdown = risk_service.get_category_breakdown(supplier_id)

    if not breakdown:
        raise HTTPException(status_code=404, detail="No risk assessment found for this supplier")

    return breakdown


@router.get("/{supplier_id}/risk-trend")
async def get_risk_trend(
    supplier_id: int,
    days: int = Query(90, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get risk score trend over time for a supplier."""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()

    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    risk_service = RiskScoringService(db)
    trend = risk_service.get_risk_trend(supplier_id, days=days)

    return {
        "supplier_id": supplier_id,
        "supplier_name": supplier.name,
        "period_days": days,
        "data_points": len(trend),
        "trend": trend
    }


@router.post("/{supplier_id}/assess")
async def run_risk_assessment(
    supplier_id: int,
    contract_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Trigger a full risk assessment for a supplier using all AI agents."""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()

    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    orchestrator = AegisOrchestrator(db)

    try:
        result = await orchestrator.run_full_assessment(supplier_id, contract_id)

        # Update supplier's last assessment date
        supplier.last_assessment_date = datetime.now()
        db.commit()

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assessment failed: {str(e)}")


@router.get("/{supplier_id}/alerts")
async def get_supplier_alerts(
    supplier_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get alerts for a specific supplier."""
    from src.db.models import Alert

    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()

    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    alerts = (
        db.query(Alert)
        .filter(Alert.supplier_id == supplier_id)
        .order_by(Alert.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [
        {
            "id": alert.id,
            "title": alert.title,
            "message": alert.message,
            "severity": alert.severity.value,
            "category": alert.category,
            "is_read": alert.is_read,
            "is_resolved": alert.is_resolved,
            "created_at": alert.created_at.isoformat(),
            "source": alert.source,
        }
        for alert in alerts
    ]


@router.get("/{supplier_id}/contracts")
async def get_supplier_contracts(
    supplier_id: int,
    db: Session = Depends(get_db)
):
    """Get all contracts for a supplier."""
    from src.db.models import Contract

    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()

    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    contracts = (
        db.query(Contract)
        .filter(Contract.supplier_id == supplier_id)
        .order_by(Contract.created_at.desc())
        .all()
    )

    return [
        {
            "id": contract.id,
            "contract_number": contract.contract_number,
            "title": contract.title,
            "status": contract.status.value,
            "contract_value": contract.contract_value,
            "currency": contract.currency,
            "start_date": contract.start_date.isoformat() if contract.start_date else None,
            "end_date": contract.end_date.isoformat() if contract.end_date else None,
            "outcome": contract.outcome.value if contract.outcome else None,
        }
        for contract in contracts
    ]
