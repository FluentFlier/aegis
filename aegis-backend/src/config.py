"""
Configuration module for Aegis backend.
Loads environment variables and provides application settings.
"""
from pydantic_settings import BaseSettings
from pydantic import Field, validator
from typing import Optional
import os
from pathlib import Path


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database Configuration
    DATABASE_URL: str = Field(
        default="postgresql://aegis_user:aegis_password@localhost:5432/aegis_db",
        description="PostgreSQL database connection URL"
    )
    DATABASE_POOL_SIZE: int = Field(default=20, description="Database connection pool size")
    DATABASE_MAX_OVERFLOW: int = Field(default=40, description="Max overflow connections")

    # Redis Configuration
    REDIS_URL: str = Field(default="redis://localhost:6379/0", description="Redis connection URL")

    # Google Gemini API
    GOOGLE_API_KEY: str = Field(default="", description="Google Gemini API key")

    # JWT Authentication
    SECRET_KEY: str = Field(
        default="your-secret-key-change-in-production",
        description="Secret key for JWT encoding"
    )
    ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=30,
        description="Access token expiration time in minutes"
    )

    # Environment
    ENVIRONMENT: str = Field(default="development", description="Environment (development/production)")
    DEBUG: bool = Field(default=True, description="Debug mode")

    # ML Model Configuration
    ML_MODEL_RETRAIN_SCHEDULE: str = Field(
        default="weekly",
        description="ML model retraining schedule (daily/weekly/monthly)"
    )
    ML_MODEL_MIN_SAMPLES: int = Field(
        default=50,
        description="Minimum samples required for model retraining"
    )
    ML_MODEL_VALIDATION_SPLIT: float = Field(
        default=0.2,
        description="Validation split ratio for ML models"
    )
    ML_FEATURE_IMPORTANCE_THRESHOLD: float = Field(
        default=0.01,
        description="Minimum feature importance threshold"
    )

    # Risk Matrix Configuration
    RISK_MATRIX_VERSION: str = Field(default="v1.0.0", description="Current risk matrix version")
    RISK_MATRIX_AUTO_APPROVE: bool = Field(
        default=False,
        description="Auto-approve new risk matrix versions"
    )
    RISK_MATRIX_APPROVAL_REQUIRED: bool = Field(
        default=True,
        description="Require manual approval for new weights"
    )

    # Agent Configuration
    AGENT_MAX_RETRIES: int = Field(default=3, description="Maximum retries for agent tasks")
    AGENT_TIMEOUT_SECONDS: int = Field(default=30, description="Agent task timeout in seconds")
    AGENT_CONCURRENCY: int = Field(default=5, description="Maximum concurrent agent tasks")

    # Logging
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    LOG_FORMAT: str = Field(default="json", description="Log format (json/text)")

    # Application Metadata
    APP_NAME: str = Field(default="Aegis Backend", description="Application name")
    APP_VERSION: str = Field(default="1.0.0", description="Application version")

    # CORS
    ALLOWED_ORIGINS: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173"],
        description="Allowed CORS origins"
    )

    # Model Storage
    MODEL_STORAGE_PATH: str = Field(
        default="./models",
        description="Path to store ML models"
    )

    @validator("GOOGLE_API_KEY")
    def validate_api_key(cls, v):
        """Validate that API key is set in production."""
        return v

    @validator("SECRET_KEY")
    def validate_secret_key(cls, v, values):
        """Validate that secret key is changed in production."""
        if values.get("ENVIRONMENT") == "production" and v == "your-secret-key-change-in-production":
            raise ValueError("SECRET_KEY must be changed in production")
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Global settings instance
settings = Settings()

# Create model storage directory if it doesn't exist
Path(settings.MODEL_STORAGE_PATH).mkdir(parents=True, exist_ok=True)
