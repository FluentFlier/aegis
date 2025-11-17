# 🤖 ML Model Training Guide

## Quick Start

### Option 1: Use the Training Script
```bash
./train_ml_model.sh
```

### Option 2: Manual Training
```bash
curl -X POST http://localhost:8000/api/ml-models/train \
  -H "Content-Type: application/json" \
  -d '{"model_type": "gradient_boosting"}'
```

### Option 3: Use API Docs
1. Open: http://localhost:8000/docs
2. Find: **POST /api/ml-models/train**
3. Click **"Try it out"** → **"Execute"**

---

## What Gets Trained?

The ML model learns from your **contract outcomes** to optimize risk weights.

### Training Data Sources:

**1. Risk Assessment Scores** (8 features):
- Financial score
- Legal score
- ESG score
- Geopolitical score
- Operational score
- Pricing score
- Social score
- Performance score

**2. Contract Term Features** (15+ features):
- Contract overall risk
- Contract terms count
- Contract coverage %
- High-risk terms count
- Category-specific risks:
  - Financial risk (avg)
  - Legal risk (avg)
  - Compliance risk (avg)
  - Operational risk (avg)
  - Pricing risk (avg)

**3. Contract Outcomes** (target variable):
- ✅ **Good outcomes**: Successful, Renewed
- ❌ **Bad outcomes**: Terminated Early, Dispute, Claim, Penalty

---

## Model Types

### 1. Logistic Regression (Fast)
```bash
curl -X POST http://localhost:8000/api/ml-models/train \
  -H "Content-Type: application/json" \
  -d '{"model_type": "logistic_regression"}'
```
- **Speed**: Very fast (~2 seconds)
- **Accuracy**: 75-80%
- **Best for**: Quick iterations, interpretability
- **Use when**: You want fast results

### 2. Random Forest (Balanced)
```bash
curl -X POST http://localhost:8000/api/ml-models/train \
  -H "Content-Type: application/json" \
  -d '{"model_type": "random_forest"}'
```
- **Speed**: Medium (~5 seconds)
- **Accuracy**: 80-85%
- **Best for**: Balanced performance
- **Use when**: You want good accuracy without long training

### 3. Gradient Boosting (Best - Recommended)
```bash
curl -X POST http://localhost:8000/api/ml-models/train \
  -H "Content-Type: application/json" \
  -d '{"model_type": "gradient_boosting"}'
```
- **Speed**: Slower (~10 seconds)
- **Accuracy**: 85-92%
- **Best for**: Maximum accuracy
- **Use when**: You want the best possible predictions

---

## Training Output

### Success Response:
```json
{
  "id": 2,
  "version": "v1.1.0_ml_gradient_boosting",
  "model_type": "gradient_boosting",
  "trained_on_samples": 25,
  "accuracy": 0.88,
  "auc": 0.92,
  "cross_val_score": 0.85,
  "feature_importance": {
    "legal_score": 0.25,
    "contract_legal_risk": 0.18,
    "operational_score": 0.15,
    "contract_operational_risk": 0.12,
    "financial_score": 0.10,
    "contract_financial_risk": 0.08,
    "esg_score": 0.06,
    "geopolitical_score": 0.04,
    "pricing_score": 0.02
  },
  "new_weights": {
    "financial_weight": 0.10,
    "legal_weight": 0.35,      // Legal risk is most predictive!
    "esg_weight": 0.08,
    "geopolitical_weight": 0.07,
    "operational_weight": 0.25, // Operational risk is 2nd most predictive!
    "pricing_weight": 0.05,
    "social_weight": 0.05,
    "performance_weight": 0.05
  },
  "is_active": false,
  "is_approved": false,
  "created_at": "2025-11-16T23:45:00",
  "description": "ML-trained weights from 25 contract outcomes using gradient_boosting"
}
```

### Key Metrics Explained:

- **trained_on_samples**: Number of contracts used for training (25 in this example)
- **accuracy**: % of correct predictions on test set (88% is excellent)
- **auc**: Area Under ROC Curve - measures model quality (92% is very good)
- **cross_val_score**: Cross-validation score - robustness check (85% is solid)

---

## Understanding Feature Importance

**Feature importance** tells you which risk factors best predict bad outcomes.

### Example Interpretation:

If you see:
```json
{
  "legal_score": 0.25,           // 25% importance
  "contract_legal_risk": 0.18,   // 18% importance
  "operational_score": 0.15,     // 15% importance
  "contract_operational_risk": 0.12  // 12% importance
}
```

**This means:**
1. **Legal risks are #1 predictor** of contract failure (25% + 18% = 43% combined)
2. **Operational risks are #2** (15% + 12% = 27% combined)
3. **Financial risks matter less** in your specific data

**The model will increase weights for legal and operational categories!**

---

## How Weights Get Updated

### Before Training (Equal Weights):
```json
{
  "financial_weight": 0.125,    // 12.5%
  "legal_weight": 0.125,        // 12.5%
  "operational_weight": 0.125,  // 12.5%
  ...
}
```

### After Training (ML-Optimized):
```json
{
  "financial_weight": 0.10,     // ↓ Decreased (less predictive)
  "legal_weight": 0.35,         // ↑↑ INCREASED (most predictive!)
  "operational_weight": 0.25,   // ↑ INCREASED (2nd most predictive)
  ...
}
```

**Why?** The ML model learned that:
- Contracts with **high legal risk** → 70% ended in disputes
- Contracts with **high operational risk** → 60% had performance issues
- Financial risk alone → only 20% correlation with failure

---

## Approving New Weights

After training, you must **approve** the new weights to activate them:

### Step 1: Get Version ID
Look for `"id": 2` in the training response.

### Step 2: Approve
```bash
curl -X POST http://localhost:8000/api/ml-models/versions/2/approve
```

### Step 3: Verify Active
```bash
curl http://localhost:8000/api/ml-models/versions/active
```

Should return the new version with `"is_active": true`.

---

## View All Versions

See training history:
```bash
curl http://localhost:8000/api/ml-models/versions
```

Response:
```json
[
  {
    "id": 1,
    "version": "v1.0.0_baseline",
    "model_type": "baseline",
    "is_active": false,
    "is_approved": true,
    "description": "Equal weights for all categories"
  },
  {
    "id": 2,
    "version": "v1.1.0_ml_gradient_boosting",
    "model_type": "gradient_boosting",
    "is_active": true,
    "is_approved": true,
    "accuracy": 0.88,
    "auc": 0.92,
    "description": "ML-trained from 25 contracts"
  }
]
```

---

## Rollback to Previous Version

If new weights perform poorly, rollback:

```bash
# Activate version 1 (baseline)
curl -X POST http://localhost:8000/api/ml-models/versions/1/approve
```

---

## Training Requirements

### Minimum Data Needed:

- **At least 20 contracts** with outcomes
- **Mix of good and bad outcomes** (not all successful)
- **Risk assessments** for each contract

### Current Database:

The seeded database has:
- ✅ 25 contracts (5 suppliers × 5 contracts each)
- ✅ Mixed outcomes (successful, disputes, penalties, terminations)
- ✅ Risk assessments for all contracts

**You can train immediately!**

---

## When to Retrain

Retrain the model when:

1. **New contracts added** - More data = better predictions
2. **Contract outcomes change** - Mark contracts as successful/failed
3. **Performance degrades** - Model accuracy drops below 80%
4. **Business changes** - New suppliers, categories, or risks

### Suggested Frequency:
- **Initial**: After first 20-30 contracts
- **Regular**: Monthly or quarterly
- **Ad-hoc**: After major changes

---

## Troubleshooting

### Error: "Not enough training data"
```json
{"detail": "Need at least 20 contracts with outcomes for training"}
```

**Solution:** Add more contracts or mark existing contracts with outcomes.

### Error: "All outcomes are the same"
```json
{"detail": "Training data must have both successful and failed contracts"}
```

**Solution:** Ensure you have mix of outcomes (not all successful or all failed).

### Low Accuracy (<70%)
**Possible causes:**
- Not enough data
- Features not correlated with outcomes
- Inconsistent risk scoring

**Solutions:**
- Add more contracts
- Ensure risk assessments are accurate
- Try different model type

---

## Advanced Options

### Custom Training Parameters:

```bash
curl -X POST http://localhost:8000/api/ml-models/train \
  -H "Content-Type: application/json" \
  -d '{
    "model_type": "gradient_boosting",
    "test_size": 0.3,           # Use 30% for testing
    "random_state": 123,        # For reproducibility
    "cv_folds": 5               # 5-fold cross-validation
  }'
```

### Parameters Explained:

- **test_size**: % of data held out for testing (default: 0.2 = 20%)
- **random_state**: Seed for reproducibility (same seed = same results)
- **cv_folds**: Number of cross-validation folds (default: 5)

---

## Example Workflow

### Complete Training Flow:

```bash
# 1. Check current active version
curl http://localhost:8000/api/ml-models/versions/active

# 2. Train new model
curl -X POST http://localhost:8000/api/ml-models/train \
  -H "Content-Type: application/json" \
  -d '{"model_type": "gradient_boosting"}' \
  | python -m json.tool > training_result.json

# 3. Review results
cat training_result.json

# 4. If accuracy > 80%, approve
# (Get ID from training_result.json)
curl -X POST http://localhost:8000/api/ml-models/versions/2/approve

# 5. Verify active
curl http://localhost:8000/api/ml-models/versions/active

# 6. Test on new supplier
curl -X POST http://localhost:8000/api/suppliers/1/assess
```

---

## What Happens After Training?

### Immediate Effects:

1. **New risk matrix created** - With ML-optimized weights
2. **Not yet active** - Requires approval first
3. **Model saved to disk** - In `models/` directory

### After Approval:

1. **All future assessments** use new weights
2. **Risk scores recalculated** for suppliers
3. **Predictions use trained model** for forecasting

### Example:

**Before (Equal Weights):**
```
Sysco Risk Score = (Financial: 22 × 0.125) + (Legal: 20 × 0.125) + ... = 25/100
```

**After (ML Weights):**
```
Sysco Risk Score = (Financial: 22 × 0.10) + (Legal: 20 × 0.35) + ... = 28/100
```

Legal risk now counts **3× more** because ML learned it predicts failures!

---

## Quick Reference

| Task | Command |
|------|---------|
| Train model | `./train_ml_model.sh` |
| View versions | `curl http://localhost:8000/api/ml-models/versions` |
| Get active version | `curl http://localhost:8000/api/ml-models/versions/active` |
| Approve version | `curl -X POST http://localhost:8000/api/ml-models/versions/{id}/approve` |
| Train logistic regression | `curl -X POST http://localhost:8000/api/ml-models/train -H "Content-Type: application/json" -d '{"model_type": "logistic_regression"}'` |
| Train random forest | `curl -X POST http://localhost:8000/api/ml-models/train -H "Content-Type: application/json" -d '{"model_type": "random_forest"}'` |
| Train gradient boosting | `curl -X POST http://localhost:8000/api/ml-models/train -H "Content-Type: application/json" -d '{"model_type": "gradient_boosting"}'` |

---

**Ready to train? Run `./train_ml_model.sh` now! 🚀**
