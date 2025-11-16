"""
SQLAlchemy ORM models for Aegis backend.
Defines all database tables and relationships.
"""
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, JSON,
    ForeignKey, Enum as SQLEnum, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum

from src.db.database import Base


# Enums
class SupplierStatus(str, enum.Enum):
    ACTIVE = "Active"
    CRITICAL = "Critical"
    UNDER_REVIEW = "Under Review"
    PENDING = "Pending"
    INACTIVE = "Inactive"


class AlertSeverity(str, enum.Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"


class ContractStatus(str, enum.Enum):
    DRAFT = "draft"
    UNDER_REVIEW = "under_review"
    ACTIVE = "active"
    EXPIRED = "expired"
    TERMINATED = "terminated"


class ContractOutcome(str, enum.Enum):
    RENEWED = "renewed"
    TERMINATED_EARLY = "terminated_early"
    DISPUTE = "dispute"
    CLAIM = "claim"
    PENALTY = "penalty"
    SUCCESSFUL = "successful"


class RiskCategory(str, enum.Enum):
    FINANCIAL = "financial"
    LEGAL = "legal"
    ESG = "esg"
    GEOPOLITICAL = "geopolitical"
    OPERATIONAL = "operational"
    PRICING = "pricing"
    SOCIAL = "social"
    PERFORMANCE = "performance"


class AgentType(str, enum.Enum):
    FINANCIAL = "financial"
    LEGAL = "legal"
    ESG = "esg"
    GEOPOLITICAL = "geopolitical"
    OPERATIONAL = "operational"
    PRICING = "pricing"
    SOCIAL = "social"
    PERFORMANCE = "performance"


# Models
class User(Base):
    """User model for authentication and authorization."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    activities = relationship("AgentActivity", back_populates="user")


class Supplier(Base):
    """Supplier/vendor model."""
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    status = Column(SQLEnum(SupplierStatus), default=SupplierStatus.ACTIVE, index=True)
    region = Column(String(100), index=True)
    country = Column(String(100))
    category = Column(String(100), index=True)
    annual_volume = Column(Float)  # Annual spend/volume
    currency = Column(String(10), default="USD")

    # Contact information
    contact_name = Column(String(255))
    contact_email = Column(String(255))
    contact_phone = Column(String(50))

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_assessment_date = Column(DateTime(timezone=True))

    # Additional info
    description = Column(Text)
    tags = Column(JSON)  # Array of tags
    metadata = Column(JSON)  # Additional flexible data

    # Relationships
    contracts = relationship("Contract", back_populates="supplier", cascade="all, delete-orphan")
    risk_assessments = relationship("RiskAssessment", back_populates="supplier", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="supplier", cascade="all, delete-orphan")
    agent_activities = relationship("AgentActivity", back_populates="supplier")

    # Indexes
    __table_args__ = (
        Index('idx_supplier_status_region', 'status', 'region'),
    )


class Contract(Base):
    """Contract model."""
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False, index=True)
    contract_number = Column(String(100), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    status = Column(SQLEnum(ContractStatus), default=ContractStatus.DRAFT, index=True)

    # Contract dates
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    signed_date = Column(DateTime(timezone=True))

    # Financial
    contract_value = Column(Float)
    currency = Column(String(10), default="USD")
    payment_terms = Column(String(255))

    # Document
    document_url = Column(String(500))
    document_hash = Column(String(255))  # For integrity verification

    # Outcomes (for ML training)
    outcome = Column(SQLEnum(ContractOutcome), nullable=True, index=True)
    outcome_date = Column(DateTime(timezone=True))
    loss_amount = Column(Float, default=0.0)  # Financial loss if any
    dispute_flag = Column(Boolean, default=False)
    claim_flag = Column(Boolean, default=False)
    penalty_amount = Column(Float, default=0.0)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    reviewed_at = Column(DateTime(timezone=True))
    reviewed_by = Column(Integer, ForeignKey("users.id"))

    # Additional info
    clauses = Column(JSON)  # Array of contract clauses
    risk_flags = Column(JSON)  # Identified risk flags
    notes = Column(Text)
    metadata = Column(JSON)

    # Relationships
    supplier = relationship("Supplier", back_populates="contracts")
    risk_assessments = relationship("RiskAssessment", back_populates="contract")

    # Indexes
    __table_args__ = (
        Index('idx_contract_supplier_status', 'supplier_id', 'status'),
        Index('idx_contract_dates', 'start_date', 'end_date'),
    )


class RiskAssessment(Base):
    """Risk assessment model - stores individual risk scores."""
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=True, index=True)

    # Risk scores (0-100)
    financial_score = Column(Float, nullable=False)
    legal_score = Column(Float, nullable=False)
    esg_score = Column(Float, nullable=False)
    geopolitical_score = Column(Float, nullable=False)
    operational_score = Column(Float, nullable=False)
    pricing_score = Column(Float, nullable=False)
    social_score = Column(Float, nullable=False)
    performance_score = Column(Float, nullable=False)

    # Composite score (computed from weights)
    composite_score = Column(Float, nullable=False, index=True)

    # Confidence and metadata
    confidence_level = Column(Float)  # 0-1
    risk_matrix_version = Column(String(50), index=True)  # Which version of weights was used

    # Assessment metadata
    assessed_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    assessed_by_agent = Column(Boolean, default=True)
    agent_type = Column(SQLEnum(AgentType), nullable=True)

    # Recommendations
    recommendation = Column(String(50))  # "Proceed", "Negotiate", "Replace"
    recommendation_rationale = Column(Text)

    # Additional analysis
    risk_factors = Column(JSON)  # Detailed risk factors
    trends = Column(JSON)  # Trend analysis
    predictions = Column(JSON)  # Future risk predictions

    # Relationships
    supplier = relationship("Supplier", back_populates="risk_assessments")
    contract = relationship("Contract", back_populates="risk_assessments")

    # Indexes
    __table_args__ = (
        Index('idx_assessment_supplier_date', 'supplier_id', 'assessed_at'),
        Index('idx_assessment_composite_score', 'composite_score'),
    )


class RiskMatrixVersion(Base):
    """Risk matrix version model - stores different versions of risk weights."""
    __tablename__ = "risk_matrix_versions"

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String(50), unique=True, nullable=False, index=True)

    # Risk category weights (must sum to 1.0)
    financial_weight = Column(Float, nullable=False)
    legal_weight = Column(Float, nullable=False)
    esg_weight = Column(Float, nullable=False)
    geopolitical_weight = Column(Float, nullable=False)
    operational_weight = Column(Float, nullable=False)
    pricing_weight = Column(Float, nullable=False)
    social_weight = Column(Float, nullable=False)
    performance_weight = Column(Float, nullable=False)

    # Versioning metadata
    is_active = Column(Boolean, default=False, index=True)
    is_approved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    approved_at = Column(DateTime(timezone=True))
    approved_by = Column(Integer, ForeignKey("users.id"))

    # ML model metadata
    trained_on_samples = Column(Integer)  # Number of samples used for training
    model_accuracy = Column(Float)  # Validation accuracy
    model_auc = Column(Float)  # ROC AUC score
    feature_importance = Column(JSON)  # Feature importance from model

    # Model artifacts
    model_path = Column(String(500))  # Path to saved model file
    model_type = Column(String(50))  # "logistic_regression", "xgboost", etc.

    # Notes
    description = Column(Text)
    training_notes = Column(Text)

    # Indexes
    __table_args__ = (
        Index('idx_risk_matrix_active', 'is_active'),
    )


class Alert(Base):
    """Alert/event model for notifications."""
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True, index=True)

    # Alert details
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(SQLEnum(AlertSeverity), nullable=False, index=True)
    category = Column(String(100), index=True)  # "Financial", "Legal", etc.

    # Status
    is_read = Column(Boolean, default=False, index=True)
    is_resolved = Column(Boolean, default=False, index=True)
    resolved_at = Column(DateTime(timezone=True))
    resolved_by = Column(Integer, ForeignKey("users.id"))

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    source = Column(String(100))  # "agent", "system", "manual"
    source_agent = Column(SQLEnum(AgentType), nullable=True)

    # Additional data
    data = Column(JSON)  # Flexible data storage
    action_items = Column(JSON)  # Suggested actions

    # Relationships
    supplier = relationship("Supplier", back_populates="alerts")

    # Indexes
    __table_args__ = (
        Index('idx_alert_severity_date', 'severity', 'created_at'),
        Index('idx_alert_unread', 'is_read', 'created_at'),
    )


class AgentActivity(Base):
    """Agent activity log - tracks all agent actions."""
    __tablename__ = "agent_activities"

    id = Column(Integer, primary_key=True, index=True)
    agent_type = Column(SQLEnum(AgentType), nullable=False, index=True)

    # Activity details
    task_description = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, index=True)  # "in_progress", "completed", "failed"

    # Associations
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Timestamps
    started_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    completed_at = Column(DateTime(timezone=True))
    duration_seconds = Column(Float)

    # Results
    result = Column(JSON)  # Agent output/findings
    error_message = Column(Text)

    # Metadata
    metadata = Column(JSON)

    # Relationships
    supplier = relationship("Supplier", back_populates="agent_activities")
    user = relationship("User", back_populates="activities")

    # Indexes
    __table_args__ = (
        Index('idx_activity_agent_date', 'agent_type', 'started_at'),
        Index('idx_activity_status', 'status'),
    )


class ScenarioSimulation(Base):
    """Scenario simulation model for what-if analysis."""
    __tablename__ = "scenario_simulations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)

    # Simulation parameters
    parameters = Column(JSON, nullable=False)  # Input parameters
    risk_adjustments = Column(JSON)  # Risk score adjustments

    # Results
    results = Column(JSON)  # Simulation outcomes
    predicted_risk_scores = Column(JSON)  # Predicted risks
    recommendations = Column(JSON)  # Generated recommendations

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(Integer, ForeignKey("users.id"))

    # Status
    is_saved = Column(Boolean, default=False)


class ChatMessage(Base):
    """Chat message model for AI conversations."""
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), nullable=False, index=True)

    # Message details
    role = Column(String(20), nullable=False)  # "user", "assistant", "system"
    content = Column(Text, nullable=False)

    # Context
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    metadata = Column(JSON)

    # Indexes
    __table_args__ = (
        Index('idx_chat_session_date', 'session_id', 'created_at'),
    )
