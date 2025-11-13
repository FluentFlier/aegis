from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_suppliers():
    suppliers = [
        {"id": 1, "name": "TechFlow Industries", "risk_score": 35, "region": "Asia Pacific"},
        {"id": 2, "name": "Apex Manufacturing", "risk_score": 82, "region": "North America"},
        {"id": 3, "name": "GreenSource Solutions", "risk_score": 20, "region": "Europe"},
    ]
    return {"suppliers": suppliers}
