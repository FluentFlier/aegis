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
    """Create real cafe suppliers for supply chain risk management."""
    print("Creating real cafe suppliers...")

    suppliers_data = [
        {
            "name": "Sysco Corporation",
            "status": SupplierStatus.ACTIVE,
            "region": "North America",
            "country": "United States",
            "category": "Food Distribution",
            "annual_volume": 450000.0,
            "contact_name": "Sarah Johnson",
            "contact_email": "foodservice@sysco.com",
            "description": "Leading global foodservice distributor providing fresh produce, dairy, proteins, and kitchen supplies to restaurants and cafes"
        },
        {
            "name": "US Foods",
            "status": SupplierStatus.ACTIVE,
            "region": "North America",
            "country": "United States",
            "category": "Food & Beverage Distribution",
            "annual_volume": 380000.0,
            "contact_name": "Michael Chen",
            "contact_email": "customercare@usfoods.com",
            "description": "Major foodservice distributor offering dairy products, fresh produce, meats, and bakery ingredients"
        },
        {
            "name": "Lavazza Coffee",
            "status": SupplierStatus.CRITICAL,
            "region": "Europe",
            "country": "Italy",
            "category": "Coffee & Espresso",
            "annual_volume": 285000.0,
            "contact_name": "Marco Rossi",
            "contact_email": "commercial@lavazza.com",
            "description": "Premium Italian coffee roaster and espresso machine supplier with 125+ years of expertise in specialty coffee"
        },
        {
            "name": "The Coca-Cola Company",
            "status": SupplierStatus.ACTIVE,
            "region": "North America",
            "country": "United States",
            "category": "Beverages",
            "annual_volume": 195000.0,
            "contact_name": "Jennifer Martinez",
            "contact_email": "foodservice@coca-cola.com",
            "description": "Global beverage leader providing sodas, juices, water, and fountain drink systems for foodservice"
        },
        {
            "name": "Rich Products Corporation",
            "status": SupplierStatus.ACTIVE,
            "region": "North America",
            "country": "United States",
            "category": "Bakery & Frozen Foods",
            "annual_volume": 215000.0,
            "contact_name": "David Thompson",
            "contact_email": "foodservice@rich.com",
            "description": "Family-owned supplier of frozen bakery products, pastries, donuts, and specialty desserts for cafes and bakeries"
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

    # Risk score patterns for real cafe suppliers
    risk_patterns = {
        "Sysco Corporation": {"base": 22, "variance": 6},  # Low risk - stable, large, publicly traded
        "US Foods": {"base": 25, "variance": 7},   # Low risk - major distributor, reliable
        "Lavazza Coffee": {"base": 45, "variance": 12},  # Medium risk - international, critical dependency
        "The Coca-Cola Company": {"base": 18, "variance": 5},  # Very low risk - global leader, stable
        "Rich Products Corporation": {"base": 28, "variance": 8},  # Low-moderate risk - family-owned, reliable
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


def seed_contract_risk_assessments(db: Session, contracts: list, risk_matrix: RiskMatrixVersion):
    """Create risk assessments linked to contracts for ML training."""
    print("Creating contract risk assessments for ML training...")

    assessments = []

    for contract in contracts:
        # Generate risk scores based on contract outcome
        # Bad outcomes should have higher risk scores
        if contract.outcome in ["TERMINATED_EARLY", "DISPUTE", "PENALTY"]:
            base_score = random.uniform(60, 90)  # High risk
        elif contract.outcome in ["SUCCESSFUL", "RENEWED"]:
            base_score = random.uniform(15, 40)  # Low risk
        else:
            base_score = random.uniform(40, 60)  # Medium risk

        # Generate correlated risk scores
        financial_score = max(0, min(100, base_score + random.uniform(-10, 10)))
        legal_score = max(0, min(100, base_score + random.uniform(-15, 15)))
        esg_score = max(0, min(100, base_score + random.uniform(-12, 12)))
        geopolitical_score = max(0, min(100, base_score + random.uniform(-8, 8)))
        operational_score = max(0, min(100, base_score + random.uniform(-10, 10)))
        pricing_score = max(0, min(100, base_score + random.uniform(-5, 5)))
        social_score = max(0, min(100, base_score + random.uniform(-10, 10)))
        performance_score = max(0, min(100, base_score + random.uniform(-12, 12)))

        # Calculate composite score
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
            supplier_id=contract.supplier_id,
            contract_id=contract.id,  # Link to contract for ML training
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
            assessed_at=contract.signed_date + timedelta(days=random.randint(1, 30)),
            recommendation=recommendation,
            recommendation_rationale=f"Contract assessment for {contract.contract_number}",
            risk_factors={"contract_value": float(contract.contract_value), "outcome": str(contract.outcome)}
        )

        db.add(assessment)
        assessments.append(assessment)

    db.commit()
    print(f"✓ Created {len(assessments)} contract risk assessments")

    return assessments


def seed_alerts(db: Session, suppliers: list):
    """Create sample alerts."""
    print("Creating sample alerts...")

    alerts_data = [
        {
            "supplier_id": suppliers[2].id,  # Lavazza Coffee (Critical supplier)
            "title": "Geopolitical Risk Alert - Coffee Supply Chain",
            "message": "Climate change affecting coffee bean harvest in Brazil and Colombia. Price volatility expected. Consider diversifying coffee suppliers.",
            "severity": AlertSeverity.CRITICAL,
            "category": "Geopolitical",
            "is_read": False,
            "is_resolved": False,
            "source": "agent",
            "source_agent": AgentType.GEOPOLITICAL,
        },
        {
            "supplier_id": suppliers[0].id,  # Sysco
            "title": "Delivery Schedule Update",
            "message": "Sysco has updated delivery schedules for fresh produce. New routes may affect morning delivery times.",
            "severity": AlertSeverity.WARNING,
            "category": "Operational",
            "is_read": True,
            "is_resolved": False,
            "source": "system",
        },
        {
            "supplier_id": suppliers[4].id,  # Rich Products
            "title": "New Product Line Available",
            "message": "Rich Products launched new line of gluten-free pastries and vegan desserts. Samples available for tasting.",
            "severity": AlertSeverity.INFO,
            "category": "Operational",
            "is_read": True,
            "is_resolved": True,
            "source": "agent",
            "source_agent": AgentType.OPERATIONAL,
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
        contract_assessments = seed_contract_risk_assessments(db, contracts, risk_matrix)
        alerts = seed_alerts(db, suppliers)

        print("\n" + "=" * 60)
        print("✓ Database seeding completed successfully!")
        print("=" * 60)
        print(f"\nCreated:")
        print(f"  - 1 risk matrix version")
        print(f"  - {len(suppliers)} suppliers")
        print(f"  - {len(contracts)} contracts")
        print(f"  - {len(assessments)} supplier risk assessments")
        print(f"  - {len(contract_assessments)} contract risk assessments (for ML)")
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
