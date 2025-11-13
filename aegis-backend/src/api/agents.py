from fastapi import APIRouter, Request
from src.agents.orchestrator import AegisOrchestrator

router = APIRouter()
orchestrator = AegisOrchestrator()

@router.post("/dispatch")
async def dispatch_agent(request: Request):
    data = await request.json()
    task = data.get("task", "")
    supplier_id = data.get("supplier_id", None)

    print(f"[Agent] Task received: {task} for supplier {supplier_id}")

    result = await orchestrator.delegate(task, supplier_id)
    return {"status": "ok", "task": task, "result": result}
