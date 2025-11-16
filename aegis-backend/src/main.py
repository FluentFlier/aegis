"""
Aegis Backend - AI-Powered Supply Chain Risk Management Platform.

This application provides:
1. Real-time supplier risk monitoring across 8 dimensions
2. AI agent-based analysis using Google Gemini
3. Adaptive ML learning from contract outcomes
4. Comprehensive analytics and reporting
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from src.config import settings
from src.db.database import init_db, engine
from src.api import suppliers, agents, alerts, analytics, ml_models

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events.

    Startup:
    - Initialize database tables
    - Log application startup

    Shutdown:
    - Clean up resources
    """
    # Startup
    logger.info("=" * 60)
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info("=" * 60)

    # Initialize database
    try:
        logger.info("Initializing database...")
        init_db()
        logger.info("✓ Database initialized successfully")
    except Exception as e:
        logger.error(f"✗ Database initialization failed: {str(e)}")
        if settings.ENVIRONMENT == "production":
            raise

    # Check Gemini API key
    if settings.GOOGLE_API_KEY:
        logger.info("✓ Google Gemini API key configured")
    else:
        logger.warning("⚠ GOOGLE_API_KEY not set - AI agents will have limited functionality")

    logger.info("=" * 60)
    logger.info("🚀 Application ready!")
    logger.info(f"📊 API Documentation: http://localhost:8000/docs")
    logger.info("=" * 60)

    yield

    # Shutdown
    logger.info("Shutting down Aegis Backend...")
    engine.dispose()
    logger.info("✓ Shutdown complete")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered Supply Chain Risk Management Platform with Adaptive Learning",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions gracefully."""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)

    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "message": str(exc) if settings.DEBUG else "An error occurred"
        }
    )


# Include routers
app.include_router(suppliers.router)
app.include_router(agents.router)
app.include_router(alerts.router)
app.include_router(analytics.router)
app.include_router(ml_models.router)

logger.info("✓ All API routers registered")


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint - API health check.
    """
    return {
        "message": "Aegis Backend is running 🚀",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "features": {
            "suppliers": "CRUD, filtering, risk assessment",
            "agents": "8 specialized AI agents (Financial, Legal, ESG, Geo, Operational, Pricing, Social, Performance)",
            "ml_learning": "Adaptive risk weight learning from contract outcomes",
            "analytics": "Portfolio statistics, trends, regional analysis",
            "alerts": "Real-time risk notifications"
        },
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc"
        }
    }


@app.get("/health", tags=["Root"])
async def health_check():
    """
    Health check endpoint for monitoring.
    """
    # Check database connection
    try:
        from src.db.database import SessionLocal
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        db_status = "healthy"
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        db_status = "unhealthy"

    return {
        "status": "ok" if db_status == "healthy" else "degraded",
        "database": db_status,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }


@app.get("/info", tags=["Root"])
async def info():
    """
    Get application information and configuration.
    """
    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "debug_mode": settings.DEBUG,
        "features": {
            "adaptive_ml": True,
            "ai_agents": 8,
            "risk_categories": 8,
            "real_time_monitoring": True,
        },
        "ml_config": {
            "retrain_schedule": settings.ML_MODEL_RETRAIN_SCHEDULE,
            "min_samples": settings.ML_MODEL_MIN_SAMPLES,
            "validation_split": settings.ML_MODEL_VALIDATION_SPLIT,
            "auto_approve": settings.RISK_MATRIX_AUTO_APPROVE,
        },
        "agent_config": {
            "max_retries": settings.AGENT_MAX_RETRIES,
            "timeout_seconds": settings.AGENT_TIMEOUT_SECONDS,
            "concurrency": settings.AGENT_CONCURRENCY,
        }
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
