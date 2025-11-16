# Contract Risk Matrix - ML-Powered Legal Term Analysis

## Overview

Your Aegis platform now includes a **comprehensive contract terms risk matrix** that analyzes legal contracts and automatically identifies risky terms. This is integrated directly into your ML model to learn which contract clauses correlate with bad outcomes (disputes, terminations, penalties).

## What It Does

When you upload a contract PDF or TXT file to any supplier:

1. **Extracts text** from the document
2. **Identifies 30+ contract terms** using keyword pattern matching
3. **Calculates risk scores** for each identified term (1-10 scale)
4. **Categorizes risks** into 7 categories
5. **Generates recommendations** for negotiation and review
6. **Feeds into ML model** for future outcome prediction

## Contract Terms Analyzed (30 Terms)

### Financial Terms (8 terms)
- **Payment Terms & Invoicing** - Risk: 8/10 (buyer perspective)
- **Late Payment & Remedies** - Risk: 7/10
- **Price Adjustment/Escalation** - Risk: 7/10
- **Taxes, Tariffs, & Duties** - Risk: 6/10
- **Currency & Exchange Rate** - Risk: 6/10
- **Set-off & Withholding** - Risk: 4/10 (benefits buyer)
- **Refunds & Credits** - Risk: 7/10
- **Advance Payments** - Risk: 7/10

### Legal Terms (7 terms)
- **Indemnities** - Risk: 9/10 ⚠️ HIGH RISK
- **Limitation of Liability** - Risk: 6/10
- **Dispute Resolution** - Risk: 6/10
- **Termination for Cause** - Risk: 7/10
- **Termination for Convenience** - Risk: 5/10
- **Force Majeure** - Risk: 6/10
- **Assignment & Subcontracting** - Risk: 6/10

### Compliance Terms (5 terms)
- **Compliance with Laws** - Risk: 7/10
- **Audit & Inspection Rights** - Risk: 6/10
- **Data Protection (GDPR/HIPAA)** - Risk: 8/10 ⚠️ HIGH RISK
- **Cybersecurity** - Risk: 8/10 ⚠️ HIGH RISK
- **Anti-Bribery & Corruption** - Risk: 6/10

### Operational Terms (4 terms)
- **Scope of Work/Deliverables** - Risk: 9/10 ⚠️ HIGH RISK
- **Service Levels (SLA)** - Risk: 9/10 ⚠️ HIGH RISK
- **Warranties** - Risk: 8/10
- **Change Control** - Risk: 7/10

### Intellectual Property Terms (3 terms)
- **IP Ownership** - Risk: 9/10 ⚠️ HIGH RISK
- **License Grants** - Risk: 8/10
- **Confidentiality/NDA** - Risk: 7/10

### Strategic/Competitive Terms (3 terms)
- **Exclusivity** - Risk: 6/10
- **Most-Favored-Nation (MFN)** - Risk: 5/10
- **Change of Control** - Risk: 6/10

## How to Use

### 1. Upload a Contract

```bash
# Upload a Sysco food distribution contract
curl -X POST http://localhost:8000/api/suppliers/1/upload-document \
  -F "file=@sysco_contract_2024.pdf"
```

### 2. Get Analysis Results

The response includes:

```json
{
  "file_name": "sysco_contract_2024.pdf",
  "supplier_name": "Sysco Corporation",
  "text_length": 45678,
  "analysis": {
    "agent_results": {
      "financial": {...},
      "legal": {...},
      "esg": {...},
      "geopolitical": {...}
    },
    "summary": {
      "overall_risk_score": 62.5,
      "recommendation": "Medium Risk - Review and Negotiate",
      "key_findings": [
        "HIGH RISK CONTRACT TERM: Indemnities (Risk: 9/10) - Shifts third-party legal risk to seller",
        "HIGH RISK CONTRACT TERM: Audit Rights (Risk: 6/10) - Costly for seller if extensive audits",
        ...
      ],
      "key_recommendations": [
        "Seek legal review of 3 high-risk legal terms, especially indemnity and liability caps",
        "Review payment terms - ensure cashflow protection and avoid excessive prepayments",
        ...
      ]
    },
    "contract_analysis": {
      "overall_risk_score": 65.4,
      "perspective": "buyer",
      "terms_identified": 18,
      "high_risk_terms": [
        {
          "term": "Indemnities",
          "category": "Legal",
          "risk_score": 9,
          "matched_keywords": ["indemnify", "hold harmless"],
          "description": "Protection from third-party claims",
          "rationale": "Indemnities shift substantial third-party legal risk to seller"
        },
        ...
      ],
      "category_analysis": {
        "Financial": {
          "average_risk": 6.8,
          "term_count": 5,
          "terms": ["Payment Terms", "Late Payment", "Price Escalation", ...]
        },
        "Legal": {
          "average_risk": 7.2,
          "term_count": 4,
          "terms": ["Indemnities", "Termination", "Dispute Resolution", ...]
        },
        ...
      },
      "recommendations": [
        "Review payment terms carefully - ensure cashflow protection",
        "Seek legal review of 2 high-risk legal terms",
        "Verify SLAs and service levels are clearly defined"
      ],
      "coverage": 60.0
    }
  }
}
```

### 3. Understand the Scores

**Risk Scores (1-10 scale):**
- 1-3: Low risk (favorable terms)
- 4-6: Moderate risk (standard terms)
- 7-8: High risk (requires attention)
- 9-10: Very high risk (critical review needed)

**Overall Risk Score (0-100 scale):**
- 0-40: Low risk - Proceed
- 40-70: Medium risk - Review and negotiate
- 70-100: High risk - Exercise caution or replace supplier

**Blended Score Formula:**
```
Overall Risk = (Contract Terms Risk × 0.6) + (AI Agent Risk × 0.4)
```

This weights contract-specific legal terms more heavily than general AI analysis.

## ML Model Integration

### How Contract Terms Train the Model

1. **Feature Extraction:** When a contract is uploaded, the system extracts 15+ numerical features:
   - `contract_overall_risk`: Overall contract risk score (0-100)
   - `contract_terms_count`: Number of terms identified
   - `contract_coverage`: % of standard terms present
   - `contract_high_risk_terms`: Count of terms with risk ≥ 7
   - `contract_financial_risk`: Average financial category risk
   - `contract_legal_risk`: Average legal category risk
   - `contract_compliance_risk`: Average compliance risk
   - `contract_operational_risk`: Average operational risk
   - `contract_pricing_risk`: Average pricing risk

2. **Storage:** Features are stored in `contracts.risk_flags` JSON field:
   ```json
   {
     "contract_terms": {
       "contract_overall_risk": 65.4,
       "contract_terms_count": 18,
       "contract_financial_risk": 6.8,
       "contract_legal_risk": 7.2,
       ...
     }
   }
   ```

3. **ML Training:** When you train the ML model (`POST /api/ml-models/train`):
   - System loads all contracts with outcomes (success, dispute, termination, etc.)
   - Combines contract term features with traditional risk scores
   - Trains model to predict: **Which contracts will fail?**
   - Learns: "Contracts with high indemnity risk + high SLA risk → 80% dispute rate"

4. **Feature Importance:** After training, you can see which contract terms matter most:
   ```json
   {
     "feature_importance": {
       "contract_legal_risk": 0.25,
       "contract_operational_risk": 0.18,
       "financial_score": 0.15,
       "contract_indemnity_present": 0.12,
       ...
     }
   }
   ```

### Example: Learning from Historical Data

**Scenario:** You have 30 historical contracts:
- 10 successful contracts: Low indemnity risk (avg 4/10), Standard SLAs (avg 6/10)
- 8 disputed contracts: High indemnity risk (avg 9/10), Aggressive SLAs (avg 9/10)
- 12 renewed contracts: Moderate risk across all categories

**ML Model Learns:**
1. Indemnity clauses with risk ≥ 8 → 70% correlation with disputes
2. SLA commitments with risk ≥ 8 → 60% correlation with disputes
3. Payment terms risk matters less (only 20% correlation)

**New Risk Weights:**
```json
{
  "legal_weight": 0.35,      // ↑ Increased (indemnities matter!)
  "operational_weight": 0.25, // ↑ Increased (SLAs matter!)
  "financial_weight": 0.10,   // ↓ Decreased (less predictive)
  ...
}
```

## Real-World Cafe Use Cases

### Use Case 1: Sysco Food Distribution Contract

**Uploaded:** `sysco_supply_agreement_2024.pdf`

**Analysis Identifies:**
- Payment Terms: Net 60 (Risk: 8/10) - "Cashflow impact for small cafe"
- Price Escalation: CPI-indexed (Risk: 7/10) - "Food cost volatility risk"
- Force Majeure: Broad exemptions (Risk: 6/10) - "Supplier can suspend delivery"
- Audit Rights: Full access (Risk: 6/10) - "Must maintain detailed records"

**Recommendations:**
1. Negotiate Net 30 payment terms instead of Net 60
2. Request quarterly price review instead of automatic CPI adjustment
3. Add minimum delivery guarantees to force majeure clause
4. Ensure audit frequency is limited to annual

### Use Case 2: Lavazza Coffee Supply Contract

**Uploaded:** `lavazza_exclusive_2024.pdf`

**Analysis Identifies:**
- Exclusivity Clause: 3-year lock-in (Risk: 6/10) - "Cannot switch coffee suppliers"
- Minimum Purchase: 500 kg/month (Risk: 8/10) - "High volume commitment"
- Price Lock: 12-month fixed (Risk: 4/10) - "Protects against coffee price spikes" ✓
- Termination Fee: $25,000 (Risk: 9/10) - "Very high exit cost"

**Recommendations:**
1. Negotiate 1-year exclusivity instead of 3 years
2. Add volume flex clause (±20% monthly variation allowed)
3. Extend price lock to 18 months while coffee prices are favorable
4. Reduce termination fee or add performance-based early exit rights

### Use Case 3: Rich Products Bakery Supply

**Uploaded:** `rich_products_msa_2024.pdf`

**Analysis Identifies:**
- Product Warranty: 30-day freshness (Risk: 8/10) - "Short shelf life risk"
- Liability Cap: $50,000 (Risk: 6/10) - "Adequate for bakery items"
- Data Protection: GDPR compliance required (Risk: 8/10) - "Must protect customer data"
- Delivery SLA: 99% on-time (Risk: 9/10) - "Critical for fresh pastries"

**Recommendations:**
1. Request compensation for spoilage beyond 30 days if supplier delayed
2. Liability cap is reasonable - accept
3. Ensure data processing agreement covers customer loyalty program data
4. Add backup supplier clause if SLA drops below 95%

## API Reference

### Analyze Contract Document

```bash
POST /api/suppliers/{supplier_id}/upload-document
Content-Type: multipart/form-data

Parameters:
- file: PDF or TXT contract file

Response:
{
  "file_name": "contract.pdf",
  "file_path": "/uploaded_documents/supplier_1/20241116_contract.pdf",
  "supplier_id": 1,
  "supplier_name": "Sysco Corporation",
  "text_length": 45678,
  "processed_at": "2025-11-16T23:30:00",
  "analysis": {
    "contract_analysis": {...},
    "agent_results": {...},
    "summary": {...}
  }
}
```

### Get ML Feature Extraction

To extract just the ML features from contract text (for testing):

```python
from src.services.contract_risk_matrix import ContractRiskMatrix

# Load contract text
with open("sysco_contract.txt") as f:
    contract_text = f.read()

# Extract ML features
features = ContractRiskMatrix.extract_ml_features(
    contract_text,
    perspective="buyer"  # cafe = buyer
)

print(features)
# {
#   "contract_overall_risk": 65.4,
#   "contract_terms_count": 18,
#   "contract_coverage": 60.0,
#   "contract_high_risk_terms": 5,
#   "contract_financial_risk": 6.8,
#   "contract_legal_risk": 7.2,
#   ...
# }
```

## Customization

### Adding New Contract Terms

Edit `src/services/contract_risk_matrix.py`:

```python
ContractTerm(
    term="Delivery Guarantees",
    description="Minimum delivery frequency and volume commitments",
    category="Operational",
    risk_seller=7,  # High risk for supplier to commit
    risk_buyer=5,   # Moderate benefit for cafe
    rationale="Delivery guarantees protect buyer supply continuity",
    keywords=["minimum delivery", "guaranteed delivery", "supply commitment"]
)
```

### Adjusting Risk Weights

Change the blended scoring formula in `document_service.py`:

```python
# Current: 60% contract terms, 40% AI agents
avg_risk = (contract_risk * 0.6) + (avg_risk * 0.4)

# More conservative (trust AI more):
avg_risk = (contract_risk * 0.4) + (avg_risk * 0.6)

# Very conservative (contract terms dominate):
avg_risk = (contract_risk * 0.8) + (avg_risk * 0.2)
```

### Changing Perspective

For supplier analysis (reverse perspective):

```python
contract_analysis = ContractRiskMatrix.analyze_contract_text(
    text_content,
    perspective="seller"  # Analyze from supplier's viewpoint
)
```

## Testing

### Test with Sample Contract

Create a test contract with high-risk terms:

```text
# test_contract.txt

SUPPLY AGREEMENT

Payment Terms: Net 90 days from invoice date.

Indemnification: Supplier shall indemnify and hold harmless Buyer
from all third-party claims, including legal fees.

Limitation of Liability: Supplier's total liability is capped at
$10,000 for any and all claims.

Data Protection: Supplier must comply with GDPR and maintain
SOC2 certification for all customer data processing.

Service Level Agreement: Supplier guarantees 99.9% uptime and
4-hour response time for critical issues.

Audit Rights: Buyer may audit Supplier's facilities and records
at any time with 24-hour notice.

Termination: Either party may terminate for convenience with
30 days notice and payment of termination fee of $50,000.
```

**Expected Analysis:**
- Terms identified: 7-10
- High-risk terms: Indemnities (9/10), SLA (9/10), Audit Rights (6/10)
- Overall risk: 60-70/100
- Recommendations: "Seek legal review of indemnity clause", "Negotiate termination fee reduction"

## Benefits

1. **Automated Legal Review** - Identifies risky clauses instantly
2. **Negotiation Leverage** - Know what to push back on
3. **ML-Powered Learning** - System learns which terms lead to disputes
4. **Risk Quantification** - Convert legal language to numerical scores
5. **Consistent Analysis** - Same standards applied to all contracts
6. **Time Savings** - Reduce legal review time from days to minutes
7. **Data-Driven Decisions** - "We've had 5 disputes with high indemnity clauses"

## Limitations

1. **Keyword-Based:** May miss creatively-worded clauses
2. **English Only:** Currently only analyzes English contracts
3. **No Legal Advice:** This is risk scoring, not legal advice
4. **Context-Free:** Doesn't understand contract-specific context
5. **Training Data:** Needs 20+ contracts with outcomes for accurate ML

**Recommendation:** Use this as a first-pass screening tool, then have critical contracts reviewed by legal counsel.

## Next Steps

1. **Upload 5-10 historical contracts** to build training data
2. **Mark outcomes** (success, dispute, termination) for each contract
3. **Train ML model** to learn which terms predict bad outcomes
4. **Iterate:** Upload new contracts, get instant risk scores
5. **Monitor:** Track which suppliers have riskiest contract terms

---

**Your Aegis platform now analyzes contracts like a legal AI! 🤖⚖️**
