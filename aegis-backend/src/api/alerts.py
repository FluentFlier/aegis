"""
Alerts API endpoints - Manage notifications and events.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from src.db.database import get_db
from src.db.models import Alert, Supplier, AlertSeverity

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


# Pydantic schemas
class AlertCreate(BaseModel):
    supplier_id: Optional[int] = None
    title: str
    message: str
    severity: AlertSeverity
    category: Optional[str] = None
    data: Optional[dict] = None
    action_items: Optional[List[str]] = None


class AlertResponse(BaseModel):
    id: int
    supplier_id: Optional[int]
    supplier_name: Optional[str]
    title: str
    message: str
    severity: str
    category: Optional[str]
    is_read: bool
    is_resolved: bool
    created_at: datetime
    source: Optional[str]
    data: Optional[dict]
    action_items: Optional[List]

    class Config:
        from_attributes = True


@router.get("/", response_model=List[AlertResponse])
async def list_alerts(
    severity: Optional[AlertSeverity] = None,
    category: Optional[str] = None,
    is_read: Optional[bool] = None,
    is_resolved: Optional[bool] = None,
    supplier_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    List alerts with filtering options.

    Filters:
    - severity: Alert severity (critical/warning/info)
    - category: Alert category
    - is_read: Read status
    - is_resolved: Resolution status
    - supplier_id: Filter by specific supplier
    """
    query = db.query(Alert)

    # Apply filters
    if severity:
        query = query.filter(Alert.severity == severity)
    if category:
        query = query.filter(Alert.category == category)
    if is_read is not None:
        query = query.filter(Alert.is_read == is_read)
    if is_resolved is not None:
        query = query.filter(Alert.is_resolved == is_resolved)
    if supplier_id:
        query = query.filter(Alert.supplier_id == supplier_id)

    # Order by most recent first
    alerts = (
        query.order_by(desc(Alert.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )

    # Enrich with supplier names
    results = []
    for alert in alerts:
        alert_dict = {
            "id": alert.id,
            "supplier_id": alert.supplier_id,
            "supplier_name": None,
            "title": alert.title,
            "message": alert.message,
            "severity": alert.severity.value,
            "category": alert.category,
            "is_read": alert.is_read,
            "is_resolved": alert.is_resolved,
            "created_at": alert.created_at,
            "source": alert.source,
            "data": alert.data,
            "action_items": alert.action_items,
        }

        if alert.supplier_id:
            supplier = db.query(Supplier).filter(Supplier.id == alert.supplier_id).first()
            if supplier:
                alert_dict["supplier_name"] = supplier.name

        results.append(alert_dict)

    return results


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(alert_id: int, db: Session = Depends(get_db)):
    """Get a specific alert."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert_dict = {
        "id": alert.id,
        "supplier_id": alert.supplier_id,
        "supplier_name": None,
        "title": alert.title,
        "message": alert.message,
        "severity": alert.severity.value,
        "category": alert.category,
        "is_read": alert.is_read,
        "is_resolved": alert.is_resolved,
        "created_at": alert.created_at,
        "source": alert.source,
        "data": alert.data,
        "action_items": alert.action_items,
    }

    if alert.supplier_id:
        supplier = db.query(Supplier).filter(Supplier.id == alert.supplier_id).first()
        if supplier:
            alert_dict["supplier_name"] = supplier.name

    return alert_dict


@router.post("/", response_model=AlertResponse)
async def create_alert(alert: AlertCreate, db: Session = Depends(get_db)):
    """Create a new alert."""
    new_alert = Alert(
        supplier_id=alert.supplier_id,
        title=alert.title,
        message=alert.message,
        severity=alert.severity,
        category=alert.category,
        data=alert.data,
        action_items=alert.action_items,
        source="manual"
    )

    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)

    return {
        "id": new_alert.id,
        "supplier_id": new_alert.supplier_id,
        "supplier_name": None,
        "title": new_alert.title,
        "message": new_alert.message,
        "severity": new_alert.severity.value,
        "category": new_alert.category,
        "is_read": new_alert.is_read,
        "is_resolved": new_alert.is_resolved,
        "created_at": new_alert.created_at,
        "source": new_alert.source,
        "data": new_alert.data,
        "action_items": new_alert.action_items,
    }


@router.patch("/{alert_id}/mark-read")
async def mark_alert_read(alert_id: int, db: Session = Depends(get_db)):
    """Mark an alert as read."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_read = True
    db.commit()

    return {"status": "success", "message": "Alert marked as read"}


@router.patch("/{alert_id}/mark-unread")
async def mark_alert_unread(alert_id: int, db: Session = Depends(get_db)):
    """Mark an alert as unread."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_read = False
    db.commit()

    return {"status": "success", "message": "Alert marked as unread"}


@router.patch("/{alert_id}/resolve")
async def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    """Mark an alert as resolved."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_resolved = True
    alert.resolved_at = datetime.now()
    db.commit()

    return {"status": "success", "message": "Alert resolved"}


@router.delete("/{alert_id}")
async def delete_alert(alert_id: int, db: Session = Depends(get_db)):
    """Delete an alert."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    db.delete(alert)
    db.commit()

    return {"status": "success", "message": "Alert deleted"}


@router.get("/stats/summary")
async def get_alert_summary(db: Session = Depends(get_db)):
    """Get summary statistics for alerts."""
    total_alerts = db.query(func.count(Alert.id)).scalar()
    unread_alerts = db.query(func.count(Alert.id)).filter(Alert.is_read == False).scalar()
    unresolved_alerts = db.query(func.count(Alert.id)).filter(Alert.is_resolved == False).scalar()

    # Count by severity
    critical_count = db.query(func.count(Alert.id)).filter(
        and_(Alert.severity == AlertSeverity.CRITICAL, Alert.is_resolved == False)
    ).scalar()

    warning_count = db.query(func.count(Alert.id)).filter(
        and_(Alert.severity == AlertSeverity.WARNING, Alert.is_resolved == False)
    ).scalar()

    info_count = db.query(func.count(Alert.id)).filter(
        and_(Alert.severity == AlertSeverity.INFO, Alert.is_resolved == False)
    ).scalar()

    return {
        "total_alerts": total_alerts,
        "unread_alerts": unread_alerts,
        "unresolved_alerts": unresolved_alerts,
        "by_severity": {
            "critical": critical_count,
            "warning": warning_count,
            "info": info_count,
        }
    }


@router.post("/mark-all-read")
async def mark_all_read(db: Session = Depends(get_db)):
    """Mark all alerts as read."""
    db.query(Alert).filter(Alert.is_read == False).update({"is_read": True})
    db.commit()

    return {"status": "success", "message": "All alerts marked as read"}
