from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_alerts():
    return {
        "alerts": [
            {"id": 1, "supplier": "Apex Manufacturing", "severity": "critical", "message": "Legal risk spike"},
            {"id": 2, "supplier": "GreenSource Solutions", "severity": "moderate", "message": "Delayed shipment"}
        ]
    }

