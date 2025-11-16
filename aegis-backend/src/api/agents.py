"""
Agent API endpoints - Dispatch and manage AI agents.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from src.db.database import get_db
from src.agents.orchestrator import AegisOrchestrator
from src.db.models import AgentActivity

router = APIRouter(prefix="/api/agents", tags=["agents"])


class AgentDispatchRequest(BaseModel):
    task: str
    supplier_id: int
    contract_id: Optional[int] = None
    agent_type: Optional[str] = None  # If specified, run single agent; otherwise run all


class AgentResponse(BaseModel):
    status: str
    message: str
    result: dict


@router.post("/dispatch", response_model=AgentResponse)
async def dispatch_agent(request: AgentDispatchRequest, db: Session = Depends(get_db)):
    """
    Dispatch AI agents to perform risk analysis.

    If agent_type is specified, runs single agent.
    Otherwise, runs full risk assessment with all 8 agents.
    """
    orchestrator = AegisOrchestrator(db)

    try:
        if request.agent_type:
            # Run single agent
            result = await orchestrator.run_single_agent(
                agent_type=request.agent_type,
                supplier_id=request.supplier_id,
                contract_id=request.contract_id
            )
            return {
                "status": "success",
                "message": f"{request.agent_type.capitalize()} agent completed analysis",
                "result": result
            }
        else:
            # Run full assessment
            result = await orchestrator.run_full_assessment(
                supplier_id=request.supplier_id,
                contract_id=request.contract_id
            )
            return {
                "status": "success",
                "message": "Full risk assessment completed",
                "result": result
            }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent dispatch failed: {str(e)}")


@router.get("/activity")
async def get_agent_activity(
    supplier_id: Optional[int] = None,
    agent_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get agent activity log.

    Filters:
    - supplier_id: Filter by supplier
    - agent_type: Filter by agent type
    """
    query = db.query(AgentActivity)

    if supplier_id:
        query = query.filter(AgentActivity.supplier_id == supplier_id)
    if agent_type:
        query = query.filter(AgentActivity.agent_type == agent_type)

    activities = (
        query.order_by(AgentActivity.started_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [
        {
            "id": activity.id,
            "agent_type": activity.agent_type.value,
            "task_description": activity.task_description,
            "status": activity.status,
            "supplier_id": activity.supplier_id,
            "started_at": activity.started_at.isoformat(),
            "completed_at": activity.completed_at.isoformat() if activity.completed_at else None,
            "duration_seconds": activity.duration_seconds,
            "result": activity.result,
            "error_message": activity.error_message,
        }
        for activity in activities
    ]


@router.get("/stats")
async def get_agent_stats(db: Session = Depends(get_db)):
    """Get agent performance statistics."""
    from sqlalchemy import func

    stats = (
        db.query(
            AgentActivity.agent_type,
            func.count(AgentActivity.id).label("total_tasks"),
            func.sum(func.case((AgentActivity.status == "completed", 1), else_=0)).label("completed"),
            func.sum(func.case((AgentActivity.status == "failed", 1), else_=0)).label("failed"),
            func.avg(AgentActivity.duration_seconds).label("avg_duration")
        )
        .group_by(AgentActivity.agent_type)
        .all()
    )

    return [
        {
            "agent_type": stat.agent_type.value,
            "total_tasks": stat.total_tasks,
            "completed": stat.completed,
            "failed": stat.failed,
            "success_rate": round((stat.completed / stat.total_tasks * 100) if stat.total_tasks > 0 else 0, 2),
            "avg_duration_seconds": round(float(stat.avg_duration), 2) if stat.avg_duration else 0,
        }
        for stat in stats
    ]
