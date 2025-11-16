"""
Database seeding script - Populate database with realistic initial data.

This script creates:
1. Initial risk matrix version (baseline weights)
2. Sample suppliers with diverse profiles
3. Sample contracts with various outcomes (for ML training)
4. Historical risk assessments
5. Sample alerts
6. Agent activity records
"""
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from src.db.database import SessionLocal, init_db
from src.db.models import (
    Supplier, Contract, RiskAssessment, RiskMatrixVersion,
    Alert, AgentActivity, SupplierStatus, ContractStatus,
    ContractOutcome, AlertSeverity, AgentType
)


def seed_initial_risk_matrix(db: Session):
    """Create initial risk matrix with equal weights (baseline)."""
    print("Creating initial risk matrix...")

    initial_matrix = RiskMatrixVersion(
        version="v1.0.0_baseline",
        financial_weight=0.125,  # Equal weights (1/8)
        legal_weight=0.125,
        esg_weight=0.125,
        geopolitical_weight=0.125,
        operational_weight=0.125,
        pricing_weight=0.125,
        social_weight=0.125,
        performance_weight=0.125,
        is_active=True,
        is_approved=True,
        approved_at=datetime.now(),
        description="Baseline risk matrix with equal weights for all categories",
        trained_on_samples=0,
        model_type="baseline"
    )

    db.add(initial_matrix)
    db.commit()
    print(f"✓ Created initial risk matrix: {initial_matrix.version}")

    return initial_matrix


def seed_suppliers(db: Session):
    """Create diverse set of sample suppliers."""
    print("Creating sample suppliers...")

    suppliers_data = [
        {
            "name": "TechFlow Industries",
            "status": SupplierStatus.ACTIVE,
            "region": "Asia-Pacific",
            "country": "China",
            "category": "Electronics Manufacturing",
            "annual_volume": 2500000.0,
            "contact_name": "Li Wei",
            "contact_email": "li.wei@techflow.com",
            "description": "Leading electronics manufacturer specializing in semiconductors"
        },
        {
            "name": "Apex Manufacturing Co",
            "status": SupplierStatus.CRITICAL,
            "region": "North America",
            "country": "United States",
            "category": "Heavy Machinery",
            "annual_volume": 5800000.0,
            "contact_name": "John Smith",
            "contact_email": "j.smith@apexmfg.com",
            "description": "Industrial machinery and equipment manufacturer"
        },
        {
            "name": "GreenSource Solutions",
            "status": SupplierStatus.ACTIVE,
            "region": "Europe",
            "country": "Germany",
            "category": "Sustainable Materials",
            "annual_volume": 1200000.0,
            "contact_name": "Anna Schmidt",
            "contact_email": "a.schmidt@greensource.de",
            "description": "Eco-friendly materials supplier with strong ESG credentials"
        },
        {
            "name": "GlobalTrade Logistics",
            "status": SupplierStatus.UNDER_REVIEW,
            "region": "Middle East",
            "country": "United Arab Emirates",
            "category": "Logistics & Distribution",
            "annual_volume": 3400000.0,
            "contact_name": "Mohammed Al-Rashid",
            "contact_email": "m.rashid@globaltrade.ae",
            "description": "International logistics and supply chain services"
        },
        {
            "name": "Pacific Components Ltd",
            "status": SupplierStatus.ACTIVE,
            "region": "Asia-Pacific",
            "country": "South Korea",
            "category": "Electronics Components",
            "annual_volume": 1900000.0,
            "contact_name": "Kim Min-jun",
            "contact_email": "kim@pacificcomp.kr",
            "description": "High-quality electronic components manufacturer"
        },
        {
            "name": "Nordic Steel Group",
            "status": SupplierStatus.ACTIVE,
            "region": "Europe",
            "country": "Sweden",
            "category": "Raw Materials",
            "annual_volume": 4200000.0,
            "contact_name": "Erik Andersson",
            "contact_email": "e.andersson@nordicsteel.se",
            "description": "Steel and metal products supplier"
        },
    ]

    suppliers = []
    for data in suppliers_data:
        supplier = Supplier(**data)
        db.add(supplier)
        suppliers.append(supplier)

    db.commit()
    print(f"✓ Created {len(suppliers)} suppliers")

    return suppliers


def seed_contracts(db: Session, suppliers: list):
    """Create sample contracts with various outcomes."""
    print("Creating sample contracts...")

    contracts = []

    # Contract scenarios for ML training
    scenarios = [
        # Successful contracts
        {"status": ContractStatus.ACTIVE, "outcome": ContractOutcome.SUCCESSFUL, "loss": 0, "dispute": False},
        {"status": ContractStatus.ACTIVE, "outcome": ContractOutcome.RENEWED, "loss": 0, "dispute": False},

        # Problematic contracts
        {"status": ContractStatus.TERMINATED, "outcome": ContractOutcome.TERMINATED_EARLY, "loss": 50000, "dispute": True},
        {"status": ContractStatus.ACTIVE, "outcome": ContractOutcome.DISPUTE, "loss": 25000, "dispute": True},
        {"status": ContractStatus.ACTIVE, "outcome": ContractOutcome.PENALTY, "loss": 15000, "dispute": False},
    ]

    for i, supplier in enumerate(suppliers):
        for j, scenario in enumerate(scenarios):
            contract_number = f"CNT-{supplier.id:03d}-{j+1:03d}"

            contract = Contract(
                supplier_id=supplier.id,
                contract_number=contract_number,
                title=f"Supply Agreement {j+1} - {supplier.name}",
                status=scenario["status"],
                start_date=datetime.now() - timedelta(days=365 - j*30),
                end_date=datetime.now() + timedelta(days=365 + j*30),
                signed_date=datetime.now() - timedelta(days=380 - j*30),
                contract_value=random.uniform(100000, 1000000),
                currency="USD",
                payment_terms="Net 60",
                outcome=scenario["outcome"],
                outcome_date=datetime.now() - timedelta(days=random.randint(30, 180)),
                loss_amount=scenario["loss"],
                dispute_flag=scenario["dispute"],
                clauses=[
                    {"id": 1, "title": "Payment Terms", "content": "Payment due within 60 days"},
                    {"id": 2, "title": "Delivery", "content": "On-time delivery required"},
                    {"id": 3, "title": "Quality Standards", "content": "ISO 9001 compliance mandatory"},
                ]
            )

            db.add(contract)
            contracts.append(contract)

    db.commit()
    print(f"✓ Created {len(contracts)} contracts with outcomes")

    return contracts


def seed_risk_assessments(db: Session, suppliers: list, risk_matrix: RiskMatrixVersion):
    """Create historical risk assessments for suppliers."""
    print("Creating risk assessments...")

    assessments = []

    # Risk score patterns for different supplier types
    risk_patterns = {
        "TechFlow Industries": {"base": 35, "variance": 10},  # Moderate risk
        "Apex Manufacturing Co": {"base": 75, "variance": 15},  # High risk
        "GreenSource Solutions": {"base": 20, "variance": 5},   # Low risk
        "GlobalTrade Logistics": {"base": 55, "variance": 12},  # Medium-high risk
        "Pacific Components Ltd": {"base": 30, "variance": 8},  # Low-moderate risk
        "Nordic Steel Group": {"base": 25, "variance": 7},      # Low risk
    }

    # Create historical assessments (last 90 days)
    for supplier in suppliers:
        pattern = risk_patterns.get(supplier.name, {"base": 40, "variance": 10})

        # Create assessments over time
        num_assessments = random.randint(3, 8)
        for i in range(num_assessments):
            days_ago = 90 - (i * (90 // num_assessments))

            # Generate risk scores with some correlation (bad in one category often means bad in others)
            base_score = pattern["base"] + random.uniform(-pattern["variance"], pattern["variance"])

            # Add some correlation between categories
            financial_score = max(0, min(100, base_score + random.uniform(-10, 10)))
            legal_score = max(0, min(100, base_score + random.uniform(-15, 15)))
            esg_score = max(0, min(100, base_score + random.uniform(-12, 12)))
            geopolitical_score = max(0, min(100, base_score + random.uniform(-8, 8)))
            operational_score = max(0, min(100, base_score + random.uniform(-10, 10)))
            pricing_score = max(0, min(100, base_score + random.uniform(-5, 5)))
            social_score = max(0, min(100, base_score + random.uniform(-10, 10)))
            performance_score = max(0, min(100, base_score + random.uniform(-12, 12)))

            # Calculate composite score using current weights
            composite_score = (
                financial_score * risk_matrix.financial_weight +
                legal_score * risk_matrix.legal_weight +
                esg_score * risk_matrix.esg_weight +
                geopolitical_score * risk_matrix.geopolitical_weight +
                operational_score * risk_matrix.operational_weight +
                pricing_score * risk_matrix.pricing_weight +
                social_score * risk_matrix.social_weight +
                performance_score * risk_matrix.performance_weight
            )

            # Determine recommendation
            if composite_score < 40:
                recommendation = "Proceed"
            elif composite_score < 70:
                recommendation = "Negotiate"
            else:
                recommendation = "Replace"

            assessment = RiskAssessment(
                supplier_id=supplier.id,
                financial_score=financial_score,
                legal_score=legal_score,
                esg_score=esg_score,
                geopolitical_score=geopolitical_score,
                operational_score=operational_score,
                pricing_score=pricing_score,
                social_score=social_score,
                performance_score=performance_score,
                composite_score=composite_score,
                confidence_level=random.uniform(0.7, 0.95),
                risk_matrix_version=risk_matrix.version,
                assessed_at=datetime.now() - timedelta(days=days_ago),
                recommendation=recommendation,
                recommendation_rationale=f"Based on {num_assessments} risk factors analyzed",
                risk_factors={"categories_analyzed": 8, "data_sources": 12}
            )

            db.add(assessment)
            assessments.append(assessment)

    db.commit()
    print(f"✓ Created {len(assessments)} risk assessments")

    return assessments


def seed_alerts(db: Session, suppliers: list):
    """Create sample alerts."""
    print("Creating sample alerts...")

    alerts_data = [
        {
            "supplier_id": suppliers[1].id,  # Apex (Critical supplier)
            "title": "Legal Risk Spike Detected",
            "message": "Regulatory compliance issues identified in recent filings. Immediate review recommended.",
            "severity": AlertSeverity.CRITICAL,
            "category": "Legal",
            "is_read": False,
            "is_resolved": False,
            "source": "agent",
            "source_agent": AgentType.LEGAL,
        },
        {
            "supplier_id": suppliers[3].id,  # GlobalTrade
            "title": "Delayed Shipment",
            "message": "Two consecutive shipments delayed by more than 7 days. Operational risk increasing.",
            "severity": AlertSeverity.WARNING,
            "category": "Operational",
            "is_read": True,
            "is_resolved": False,
            "source": "system",
        },
        {
            "supplier_id": suppliers[0].id,  # TechFlow
            "title": "Financial Performance Update",
            "message": "Q3 earnings report shows improved cash flow and reduced debt levels.",
            "severity": AlertSeverity.INFO,
            "category": "Financial",
            "is_read": True,
            "is_resolved": True,
            "source": "agent",
            "source_agent": AgentType.FINANCIAL,
        },
    ]

    alerts = []
    for data in alerts_data:
        alert = Alert(**data)
        db.add(alert)
        alerts.append(alert)

    db.commit()
    print(f"✓ Created {len(alerts)} alerts")

    return alerts


def seed_database():
    """Main seeding function."""
    print("\n" + "=" * 60)
    print("Starting database seeding...")
    print("=" * 60 + "\n")

    # Initialize database
    print("Initializing database...")
    init_db()
    print("✓ Database initialized\n")

    # Create session
    db = SessionLocal()

    try:
        # Seed in order (respecting foreign key constraints)
        risk_matrix = seed_initial_risk_matrix(db)
        suppliers = seed_suppliers(db)
        contracts = seed_contracts(db, suppliers)
        assessments = seed_risk_assessments(db, suppliers, risk_matrix)
        alerts = seed_alerts(db, suppliers)

        print("\n" + "=" * 60)
        print("✓ Database seeding completed successfully!")
        print("=" * 60)
        print(f"\nCreated:")
        print(f"  - 1 risk matrix version")
        print(f"  - {len(suppliers)} suppliers")
        print(f"  - {len(contracts)} contracts")
        print(f"  - {len(assessments)} risk assessments")
        print(f"  - {len(alerts)} alerts")
        print("\nYou can now:")
        print("  1. Start the backend: uvicorn src.main:app --reload")
        print("  2. Train ML model: POST /api/ml-models/train")
        print("  3. Run risk assessments: POST /api/suppliers/{id}/assess")
        print("=" * 60 + "\n")

    except Exception as e:
        print(f"\n✗ Error during seeding: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
