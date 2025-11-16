"""
Contract Terms Risk Matrix

Based on comprehensive contractual term analysis with buyer/seller risk ratings.
Used for ML feature extraction and contract risk scoring.
"""
from typing import Dict, List, Tuple, Optional
import re
from dataclasses import dataclass


@dataclass
class ContractTerm:
    """Represents a contractual term with associated risks."""
    term: str
    description: str
    category: str
    risk_seller: int  # 1-10 scale
    risk_buyer: int   # 1-10 scale
    rationale: str
    keywords: List[str]


class ContractRiskMatrix:
    """
    Analyzes contracts based on identified terms and calculates risk scores.

    For cafe supply chain: buyer = cafe, seller = supplier
    """

    # Comprehensive contract terms matrix
    TERMS = [
        # FINANCIAL TERMS
        ContractTerm(
            term="Payment Terms & Invoicing",
            description="Defines when and how payments are made, including milestones and due dates",
            category="Financial",
            risk_seller=6,
            risk_buyer=8,
            rationale="Payment timing affects buyer cashflow; seller depends on timely payment",
            keywords=["invoice", "payment", "due", "net 30", "net 60", "payment terms", "billing"]
        ),
        ContractTerm(
            term="Late Payment & Remedies",
            description="Penalties or interest for late payments; suspension or termination rights",
            category="Financial",
            risk_seller=5,
            risk_buyer=7,
            rationale="Late-payment penalties protect seller cashflow; buyer exposure to penalties modest",
            keywords=["late fee", "interest", "overdue", "default on payment", "suspension for non-payment"]
        ),
        ContractTerm(
            term="Price Adjustment / Escalation",
            description="Mechanisms for cost changes, inflation adjustments, or indexation",
            category="Pricing",
            risk_seller=4,
            risk_buyer=7,
            rationale="Pricing escalation more material to seller margin; buyer prefers fixed pricing",
            keywords=["price increase", "escalation", "CPI", "indexation", "adjustment"]
        ),
        ContractTerm(
            term="Taxes, Tariffs, & Duties",
            description="Responsibility for VAT, sales tax, and other government charges",
            category="Financial",
            risk_seller=5,
            risk_buyer=6,
            rationale="Allocation of taxes affects both; often buyer bears sales tax",
            keywords=["tax", "VAT", "sales tax", "duties", "withholding tax"]
        ),
        ContractTerm(
            term="Currency & Exchange Rate",
            description="Determines currency of payment and risk of exchange rate changes",
            category="Financial",
            risk_seller=3,
            risk_buyer=6,
            rationale="Important for cross-border deals (seller exposed to FX if not hedged)",
            keywords=["currency", "exchange rate", "FX", "convert", "USD", "EUR"]
        ),
        ContractTerm(
            term="Set-off & Withholding",
            description="Buyer's right to withhold or offset payments against other obligations",
            category="Financial",
            risk_seller=7,
            risk_buyer=4,
            rationale="Buyer's right to set-off protects buyer; seller faces collection risk",
            keywords=["set-off", "withhold", "offset", "deduction"]
        ),
        ContractTerm(
            term="Refunds & Credits",
            description="Conditions for repayment or credit if goods/services fail or terminate early",
            category="Financial",
            risk_seller=6,
            risk_buyer=7,
            rationale="Refund mechanics affect seller liability; buyer relies on refunds for failures",
            keywords=["refund", "credit", "prorate", "reimbursement"]
        ),
        ContractTerm(
            term="Advance Payments & Security",
            description="Prepayments, deposits, or financial guarantees",
            category="Financial",
            risk_seller=4,
            risk_buyer=7,
            rationale="Seller benefits from advances; buyer bears prepayment risk",
            keywords=["deposit", "advance", "prepayment", "letter of credit", "security"]
        ),

        # LEGAL TERMS
        ContractTerm(
            term="Indemnities",
            description="Protection from third-party claims (IP, injury, breach of law, etc.)",
            category="Legal",
            risk_seller=5,
            risk_buyer=9,
            rationale="Indemnities shift substantial third-party legal risk to seller",
            keywords=["indemnify", "hold harmless", "defense", "third party claim"]
        ),
        ContractTerm(
            term="Limitation of Liability",
            description="Caps or exclusions on damages recoverable by either party",
            category="Legal",
            risk_seller=8,
            risk_buyer=6,
            rationale="Caps protect seller; buyers worry about capped recovery for damages",
            keywords=["limitation of liability", "cap", "excluded damages", "consequential"]
        ),
        ContractTerm(
            term="Dispute Resolution",
            description="Defines governing law, jurisdiction, and arbitration or mediation rules",
            category="Legal",
            risk_seller=5,
            risk_buyer=6,
            rationale="Venue and arbitration impact enforceability and cost for both",
            keywords=["arbitration", "mediation", "jurisdiction", "governing law", "AAA"]
        ),
        ContractTerm(
            term="Termination for Cause",
            description="Right to terminate if the other party breaches key obligations",
            category="Legal",
            risk_seller=6,
            risk_buyer=7,
            rationale="Seller risks losing revenue on termination; buyer needs remedy for breach",
            keywords=["terminate for cause", "material breach", "cure period"]
        ),
        ContractTerm(
            term="Termination for Convenience",
            description="Right to terminate without breach, often with notice period",
            category="Legal",
            risk_seller=7,
            risk_buyer=5,
            rationale="Convenience termination is seller risk (loss of future revenue)",
            keywords=["termination for convenience", "notice period", "termination fee"]
        ),
        ContractTerm(
            term="Force Majeure & Change in Law",
            description="Relieves obligations due to events beyond control or new laws",
            category="Legal",
            risk_seller=6,
            risk_buyer=6,
            rationale="Protects both; buyer needs continuity, seller needs excuse for non-performance",
            keywords=["force majeure", "acts of god", "change in law", "epidemic", "pandemic"]
        ),
        ContractTerm(
            term="Assignment & Subcontracting",
            description="Right to assign or subcontract contract obligations",
            category="Legal",
            risk_seller=5,
            risk_buyer=6,
            rationale="Seller wants subcontract flexibility; buyer wants control over assignment",
            keywords=["assign", "assignment", "subcontract", "novation", "delegate"]
        ),

        # COMPLIANCE TERMS
        ContractTerm(
            term="Compliance with Laws & Ethics",
            description="General obligation to comply with laws, codes of conduct, anti-bribery rules",
            category="Compliance",
            risk_seller=8,
            risk_buyer=7,
            rationale="High for buyer (regulatory exposure) and seller (operational compliance)",
            keywords=["comply with law", "anti-corruption", "anti-bribery", "law", "regulation"]
        ),
        ContractTerm(
            term="Audit & Inspection Rights",
            description="Buyer's right to inspect records or verify compliance",
            category="Compliance",
            risk_seller=9,
            risk_buyer=6,
            rationale="Critical for buyer oversight; costly for seller if extensive audits apply",
            keywords=["audit", "inspect", "records", "examination", "access to books"]
        ),
        ContractTerm(
            term="Data Protection & Privacy",
            description="Obligations under data privacy laws such as GDPR or HIPAA",
            category="Compliance",
            risk_seller=9,
            risk_buyer=8,
            rationale="High for buyer and very important for seller due to liability and trust",
            keywords=["privacy", "GDPR", "HIPAA", "personal data", "PII", "data processing"]
        ),
        ContractTerm(
            term="Information Security & Cybersecurity",
            description="Technical and procedural safeguards for systems and data",
            category="Compliance",
            risk_seller=9,
            risk_buyer=8,
            rationale="Both need strong security; buyer protects customers, seller protects platform",
            keywords=["security", "SOC2", "encryption", "breach", "incident response"]
        ),
        ContractTerm(
            term="Anti-Bribery & Corruption",
            description="Representation of ethical behavior and no bribery or kickbacks",
            category="Compliance",
            risk_seller=7,
            risk_buyer=6,
            rationale="High reputational/regulatory risk to both, slightly higher for buyer oversight",
            keywords=["anti-bribery", "FCPA", "corruption", "bribery", "kickback"]
        ),

        # OPERATIONAL TERMS
        ContractTerm(
            term="Scope of Work / Deliverables",
            description="Defines the specific goods or services and their quality levels",
            category="Operational",
            risk_seller=6,
            risk_buyer=9,
            rationale="Critical operationally for seller to deliver; buyer depends on scope for value",
            keywords=["scope", "statement of work", "deliverable", "SOW", "milestones"]
        ),
        ContractTerm(
            term="Service Levels (SLA)",
            description="Defines measurable performance metrics (uptime, response time, etc.)",
            category="Operational",
            risk_seller=6,
            risk_buyer=9,
            rationale="SLA is buyer-critical for service quality; seller must meet uptime and response targets",
            keywords=["SLA", "uptime", "availability", "99.9%", "response time"]
        ),
        ContractTerm(
            term="Warranties (Performance & Quality)",
            description="Assurances about functionality or fitness for purpose",
            category="Operational",
            risk_seller=6,
            risk_buyer=8,
            rationale="Warranties provide buyer remedies; seller assumes repair/replacement obligations",
            keywords=["warranty", "merchantability", "fitness for purpose", "remedy"]
        ),
        ContractTerm(
            term="Change Control / Variation Orders",
            description="Procedures for changing scope, schedule, or cost",
            category="Operational",
            risk_seller=6,
            risk_buyer=7,
            rationale="Controls scope creep—financial impact for seller and buyer",
            keywords=["change order", "variation", "change request", "scope change"]
        ),

        # INTELLECTUAL PROPERTY
        ContractTerm(
            term="Intellectual Property Ownership",
            description="Ownership and usage rights of IP created or used under the contract",
            category="Legal",
            risk_seller=4,
            risk_buyer=9,
            rationale="IP ownership is seller-critical; buyers often seek license not ownership",
            keywords=["ownership", "intellectual property", "IP", "assign", "ownership of work"]
        ),
        ContractTerm(
            term="License Grant & Restrictions",
            description="Scope of rights granted to use IP, software, or technology",
            category="Legal",
            risk_seller=6,
            risk_buyer=8,
            rationale="License scope critical to buyer rights and seller revenue model",
            keywords=["license", "sublicense", "sublicensing", "non-transferable", "non-exclusive"]
        ),
        ContractTerm(
            term="Confidentiality & Non-Disclosure",
            description="Protection of sensitive information shared between parties",
            category="Legal",
            risk_seller=7,
            risk_buyer=7,
            rationale="Mutual confidentiality important to both parties",
            keywords=["confidential", "NDA", "non-disclosure", "trade secret"]
        ),

        # STRATEGIC/COMPETITIVE
        ContractTerm(
            term="Exclusivity / Non-Compete",
            description="Restricts one party from working with competitors or in similar markets",
            category="Competitive",
            risk_seller=3,
            risk_buyer=6,
            rationale="Sellers value exclusivity; buyers sometimes request exclusivity",
            keywords=["exclusive", "exclusivity", "non-compete", "territory"]
        ),
        ContractTerm(
            term="Most-Favored-Nation (MFN) / Price Parity",
            description="Guarantees pricing equal to the best offered to other customers",
            category="Pricing",
            risk_seller=3,
            risk_buyer=5,
            rationale="Price parity clauses protect buyer; sellers avoid MFN",
            keywords=["MFN", "most favored nation", "price parity", "best price"]
        ),
        ContractTerm(
            term="Change of Control / Ownership",
            description="Rights triggered by a merger or acquisition of a party",
            category="Strategic",
            risk_seller=5,
            risk_buyer=6,
            rationale="Buyer may want consent rights; seller wants assignment flexibility",
            keywords=["change of control", "merger", "acquisition", "assignment"]
        ),
    ]

    @classmethod
    def analyze_contract_text(cls, text: str, perspective: str = "buyer") -> Dict:
        """
        Analyze contract text and identify risky terms.

        Args:
            text: Contract text to analyze
            perspective: "buyer" or "seller" (for cafe: buyer=cafe, seller=supplier)

        Returns:
            Dictionary with identified terms, risk scores, and recommendations
        """
        text_lower = text.lower()
        identified_terms = []
        category_scores = {}

        for term in cls.TERMS:
            # Check if any keyword appears in the text
            matched_keywords = []
            for keyword in term.keywords:
                # Use word boundaries to avoid partial matches
                pattern = r'\b' + re.escape(keyword.lower()) + r'\b'
                if re.search(pattern, text_lower):
                    matched_keywords.append(keyword)

            if matched_keywords:
                # Determine risk score based on perspective
                risk_score = term.risk_buyer if perspective == "buyer" else term.risk_seller

                identified_terms.append({
                    "term": term.term,
                    "category": term.category,
                    "risk_score": risk_score,
                    "matched_keywords": matched_keywords,
                    "description": term.description,
                    "rationale": term.rationale
                })

                # Aggregate by category
                if term.category not in category_scores:
                    category_scores[term.category] = {
                        "total_risk": 0,
                        "count": 0,
                        "terms": []
                    }

                category_scores[term.category]["total_risk"] += risk_score
                category_scores[term.category]["count"] += 1
                category_scores[term.category]["terms"].append(term.term)

        # Calculate category averages
        category_analysis = {}
        for category, data in category_scores.items():
            category_analysis[category] = {
                "average_risk": round(data["total_risk"] / data["count"], 2),
                "term_count": data["count"],
                "terms": data["terms"]
            }

        # Calculate overall risk score (0-100 scale)
        if identified_terms:
            avg_risk = sum(t["risk_score"] for t in identified_terms) / len(identified_terms)
            overall_risk_score = (avg_risk / 10) * 100  # Convert 1-10 scale to 0-100
        else:
            overall_risk_score = 50  # Default moderate risk if no terms identified

        # Generate recommendations
        recommendations = cls._generate_recommendations(identified_terms, perspective)

        # Identify high-risk terms (score >= 7)
        high_risk_terms = [t for t in identified_terms if t["risk_score"] >= 7]

        return {
            "overall_risk_score": round(overall_risk_score, 2),
            "perspective": perspective,
            "terms_identified": len(identified_terms),
            "identified_terms": identified_terms,
            "high_risk_terms": high_risk_terms,
            "category_analysis": category_analysis,
            "recommendations": recommendations,
            "coverage": round((len(identified_terms) / len(cls.TERMS)) * 100, 2)
        }

    @classmethod
    def _generate_recommendations(cls, identified_terms: List[Dict], perspective: str) -> List[str]:
        """Generate recommendations based on identified high-risk terms."""
        recommendations = []

        # Group by category
        categories = {}
        for term in identified_terms:
            cat = term["category"]
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(term)

        # Category-specific recommendations
        if "Financial" in categories:
            high_risk_financial = [t for t in categories["Financial"] if t["risk_score"] >= 7]
            if high_risk_financial:
                if perspective == "buyer":
                    recommendations.append(
                        "Review payment terms carefully - ensure cashflow protection and avoid excessive prepayments"
                    )
                else:
                    recommendations.append(
                        "Strengthen payment security provisions - consider advance payments or guarantees"
                    )

        if "Legal" in categories:
            high_risk_legal = [t for t in categories["Legal"] if t["risk_score"] >= 7]
            if high_risk_legal:
                recommendations.append(
                    f"Seek legal review of {len(high_risk_legal)} high-risk legal terms, especially indemnity and liability caps"
                )

        if "Compliance" in categories:
            high_risk_compliance = [t for t in categories["Compliance"] if t["risk_score"] >= 8]
            if high_risk_compliance:
                recommendations.append(
                    "Ensure compliance team reviews data protection, audit rights, and regulatory obligations"
                )

        if "Operational" in categories:
            high_risk_ops = [t for t in categories["Operational"] if t["risk_score"] >= 8]
            if high_risk_ops:
                recommendations.append(
                    "Verify SLAs and service levels are clearly defined and achievable with monitoring in place"
                )

        # Add general recommendation based on overall coverage
        term_count = len(identified_terms)
        if term_count < 10:
            recommendations.append(
                f"Contract appears incomplete - only {term_count} standard terms identified. Request comprehensive agreement."
            )
        elif term_count > 20:
            recommendations.append(
                f"Complex contract with {term_count} terms identified - allocate sufficient time for thorough review"
            )

        return recommendations

    @classmethod
    def extract_ml_features(cls, text: str, perspective: str = "buyer") -> Dict[str, float]:
        """
        Extract numerical features for ML model training.

        Returns a dictionary of features suitable for ML model input.
        """
        analysis = cls.analyze_contract_text(text, perspective)

        # Create feature vector
        features = {
            "contract_overall_risk": analysis["overall_risk_score"],
            "contract_terms_count": analysis["terms_identified"],
            "contract_coverage": analysis["coverage"],
            "contract_high_risk_terms": len(analysis["high_risk_terms"]),
        }

        # Add category-specific features
        for category in ["Financial", "Legal", "Compliance", "Operational", "Pricing"]:
            if category in analysis["category_analysis"]:
                features[f"contract_{category.lower()}_risk"] = analysis["category_analysis"][category]["average_risk"]
                features[f"contract_{category.lower()}_count"] = analysis["category_analysis"][category]["term_count"]
            else:
                features[f"contract_{category.lower()}_risk"] = 0
                features[f"contract_{category.lower()}_count"] = 0

        return features
