# Aegis Testing Guide

## Step 1: Kill Existing Backend Process

Your backend is already running on port 8000. Kill it first:

```bash
# Find the process using port 8000
lsof -ti:8000

# Kill it (replace PID with the number from above)
kill -9 $(lsof -ti:8000)

# Or use this one-liner
lsof -ti:8000 | xargs kill -9
```

## Step 2: Start Backend Fresh

```bash
cd ~/Aegis/aegis-backend
source venv/bin/activate
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

## Step 3: Test Backend Health

In a **new terminal**:

```bash
curl http://localhost:8000/health | python -m json.tool
```

**Expected output:**
```json
{
    "status": "ok",
    "database": "healthy",
    "version": "1.0.0",
    "environment": "development"
}
```

## Step 4: Test Data Endpoints

### Get Suppliers
```bash
curl http://localhost:8000/api/suppliers/ | python -m json.tool | head -50
```

**Expected:** List of 5 cafe suppliers (Sysco, US Foods, Lavazza, Coca-Cola, Rich Products)

### Get Specific Supplier
```bash
curl http://localhost:8000/api/suppliers/1 | python -m json.tool
```

**Expected:** Details of Sysco Corporation with risk scores

## Step 5: Test ML Model Training

### Check Current ML Models
```bash
curl http://localhost:8000/api/ml-models/versions/ | python -m json.tool
```

**Expected:** List of model versions (should include the gradient boosting model we trained)

### Check Active Model
```bash
curl http://localhost:8000/api/ml-models/versions/active | python -m json.tool
```

**Expected:**
```json
{
    "version": "v_ml_gradient_boosting_20251117_001626",
    "is_active": true,
    "weights": {
        "legal": 0.384,
        "operational": 0.322,
        ...
    }
}
```

### Train New Model (Optional)
```bash
curl -X POST http://localhost:8000/api/ml-models/train \
  -H "Content-Type: application/json" \
  -d '{"model_type": "random_forest"}' | python -m json.tool
```

**Expected:** New model version created with training results

## Step 6: Test Document Upload

### Upload Test Contract
```bash
cd ~/Aegis/aegis-backend

# Create a test contract if it doesn't exist
cat > test_contract.txt << 'EOF'
SUPPLY AGREEMENT

This agreement is between Buyer and Sysco Corporation.

Payment Terms: Net 60 days from invoice date.
Late fees of 5% will apply after 60 days.

Indemnification: Supplier shall indemnify and hold harmless Buyer
from all third-party claims arising from product defects.

Liability Cap: Total liability limited to $500,000.

Service Level Agreement: 99% on-time delivery guaranteed.
Failure to meet SLA results in 10% penalty.

Data Protection: Supplier agrees to comply with GDPR and CCPA.

Termination for Convenience: Either party may terminate with 90 days notice.
Termination fee of $25,000 applies if buyer terminates early.

Dispute Resolution: All disputes to be resolved through binding arbitration.

Force Majeure: Neither party liable for delays due to acts of God.
EOF

# Upload the contract
curl -X POST http://localhost:8000/api/suppliers/1/upload-document \
  -F "file=@test_contract.txt" \
  -s | python -m json.tool | head -100
```

**Expected:** Contract analysis with:
- Overall risk score
- High-risk terms identified
- Category breakdown (Financial, Legal, etc.)
- Recommendations

## Step 7: Test Frontend

### Start Frontend
In a **new terminal**:

```bash
cd ~/Aegis/aegis-frontend
npm run dev
```

**Expected:**
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

### Test Frontend Features

1. **Open Browser:** http://localhost:5173

2. **Complete Onboarding:**
   - Click "Begin Setup"
   - Fill in company profile
   - Click through all steps
   - Click "Launch Aegis"

3. **Expected After Onboarding:**
   - Should see dashboard with suppliers
   - Toast notification: "Connected to backend" (if backend is running)
   - OR: "Running in demo mode" (if backend is down)

4. **Test Supplier Detail:**
   - Click on "Sysco Corporation"
   - Should see supplier details
   - Click "Upload & Analyze Contract" tab
   - Drag and drop test_contract.txt or click to upload
   - Should see contract risk analysis

5. **Test ML Model Display:**
   - Dashboard should show risk scores from active ML model
   - Risk weights should reflect: Legal 38%, Operational 32%, etc.

## Step 8: Verify Integration

### Check Frontend Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Should see:
   - `GET http://localhost:8000/api/suppliers/` - Status 200
   - `GET http://localhost:8000/api/agents/activity` - Status 200
   - No CORS errors

### Check Backend Logs
In the backend terminal, you should see:
```
INFO:     127.0.0.1:XXXXX - "GET /api/suppliers/ HTTP/1.1" 200 OK
INFO:     127.0.0.1:XXXXX - "GET /api/agents/activity?limit=10 HTTP/1.1" 200 OK
```

## Common Issues & Fixes

### Issue 1: Backend Won't Start (Port in Use)
```bash
# Kill the process
lsof -ti:8000 | xargs kill -9

# Try starting again
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

### Issue 2: Frontend Shows "Demo Mode"
- Check backend is running: `curl http://localhost:8000/health`
- Check for CORS errors in browser console
- Verify VITE_API_URL in frontend/.env: `VITE_API_URL=http://localhost:8000`

### Issue 3: Document Upload Fails
- Check `uploaded_documents/` folder exists in backend
- Check file permissions: `ls -la uploaded_documents/`
- Check backend logs for errors

### Issue 4: ML Training Fails
- Check database has contracts: `curl http://localhost:8000/api/contracts/ | python -m json.tool`
- Check for contract risk assessments (need contract_id links)
- Re-run database seed if needed: `cd ~/Aegis/aegis-backend && source venv/bin/activate && python -m src.db.seed`

## Quick Health Check Script

Save this as `test_all.sh`:

```bash
#!/bin/bash

echo "🔍 Testing Aegis Integration..."
echo ""

echo "1️⃣ Backend Health:"
curl -s http://localhost:8000/health | python -m json.tool || echo "❌ Backend not responding"
echo ""

echo "2️⃣ Suppliers Count:"
SUPPLIER_COUNT=$(curl -s http://localhost:8000/api/suppliers/ | python -c "import sys, json; print(len(json.load(sys.stdin)))")
echo "   Found: $SUPPLIER_COUNT suppliers"
echo ""

echo "3️⃣ Active ML Model:"
curl -s http://localhost:8000/api/ml-models/versions/active | python -c "import sys, json; data=json.load(sys.stdin); print('   Version:', data.get('version', 'None')); print('   Legal Weight:', data.get('weights', {}).get('legal', 'N/A'))" || echo "   ❌ No active model"
echo ""

echo "4️⃣ Frontend Check:"
curl -s http://localhost:5173 > /dev/null && echo "   ✅ Frontend running on http://localhost:5173" || echo "   ❌ Frontend not running"
echo ""

echo "✅ Test complete!"
```

Make it executable and run:
```bash
chmod +x test_all.sh
./test_all.sh
```

## Success Criteria

✅ **Backend:**
- Health endpoint returns 200
- Suppliers endpoint returns 5 suppliers
- Active ML model shows gradient boosting with legal=38%
- Document upload works

✅ **Frontend:**
- Onboarding completes successfully
- Dashboard shows 5 suppliers
- Toast shows "Connected to backend"
- Supplier detail page loads
- Document upload UI works

✅ **Integration:**
- No CORS errors in browser console
- Backend logs show API requests from frontend
- Risk scores update after ML model changes
- Document uploads appear in uploaded_documents/ folder

## Next Steps After Testing

If all tests pass:
1. ✅ ML training works
2. ✅ Document upload works
3. ✅ Frontend-backend integration works
4. ✅ Risk assessments use ML weights

If tests fail, check the specific section above for troubleshooting!
