from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api import suppliers, agents, alerts
import os
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(title="Aegis Backend", version="0.1")

# Allow frontend on localhost:5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(suppliers.router, prefix="/api/suppliers", tags=["Suppliers"])
app.include_router(agents.router, prefix="/api/agents", tags=["Agents"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])

@app.get("/")
async def root():
    return {"message": "Aegis Backend is running 🚀"}
