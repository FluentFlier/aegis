# 🚀 Quick Fix - Install Dependencies & Start

## Problem
Backend failing with: `ModuleNotFoundError: No module named 'pypdf'`

## Solution (Run These Commands)

### Step 1: Install Missing Dependencies
```bash
cd ~/Aegis/aegis-backend
source venv/bin/activate
pip install -r requirements.txt
```

This will install:
- ✅ pandas (ML data processing)
- ✅ scikit-learn (ML models)
- ✅ google-generativeai (AI agents)
- ✅ pypdf (PDF text extraction)
- ✅ python-multipart (file uploads)
- ✅ pydantic-settings (config)
- ✅ joblib (model persistence)

### Step 2: Restart Backend
```bash
# Kill any existing backend
pkill -f "uvicorn.*8000"

# Start backend
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 3: Verify Backend is Running
```bash
# In a new terminal
curl http://localhost:8000/health
```

Expected output:
```json
{
  "status": "ok",
  "database": "healthy",
  "version": "1.0.0",
  "environment": "development"
}
```

---

## Now Train the ML Model

### Option 1: Quick Script
```bash
cd ~/Aegis
./train_ml_model.sh
```

### Option 2: Manual Command
```bash
curl -X POST http://localhost:8000/api/ml-models/train \
  -H "Content-Type: application/json" \
  -d '{"model_type": "gradient_boosting"}'
```

### Option 3: API Docs UI
1. Open: http://localhost:8000/docs
2. Find: `POST /api/ml-models/train`
3. Click "Try it out"
4. Click "Execute"

---

## Complete Startup Sequence

```bash
# 1. Activate venv
cd ~/Aegis/aegis-backend
source venv/bin/activate

# 2. Install dependencies (first time only)
pip install -r requirements.txt

# 3. Start backend
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload &

# 4. Wait for backend to start
sleep 5

# 5. Verify
curl http://localhost:8000/health

# 6. Train ML model
cd ..
./train_ml_model.sh
```

---

## Frontend

The frontend should already be running on http://localhost:3000

If not:
```bash
cd ~/Aegis/aegis-frontend
npm run dev
```

---

## Test Everything

### 1. Check Backend
```bash
curl http://localhost:8000/health
```

### 2. Check Suppliers
```bash
curl http://localhost:8000/api/suppliers/ | python -m json.tool | head -30
```

### 3. Train ML Model
```bash
curl -X POST http://localhost:8000/api/ml-models/train \
  -H "Content-Type: application/json" \
  -d '{"model_type": "gradient_boosting"}' | python -m json.tool
```

### 4. Upload Test Contract
```bash
curl -X POST http://localhost:8000/api/suppliers/1/upload-document \
  -F "file=@test_sysco_contract.txt" | python -m json.tool | head -50
```

### 5. Open Frontend
```bash
open http://localhost:3000
```

---

## Troubleshooting

### Backend Still Won't Start?

**Check Python Version:**
```bash
python --version  # Should be 3.10 or 3.11
```

**Recreate Virtual Environment:**
```bash
cd ~/Aegis/aegis-backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Port 8000 Already in Use?

```bash
# Find and kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use different port
uvicorn src.main:app --host 0.0.0.0 --port 8001 --reload
```

### Can't Connect to Gemini API?

Check your API key in `.env`:
```bash
cat ~/Aegis/aegis-backend/.env | grep GOOGLE_API_KEY
```

Should show:
```
GOOGLE_API_KEY=AIzaSyBEGCtjvnekMkYK2p3uxqkOJKp863UwO90
```

---

## All Working?

**Backend:** ✅ http://localhost:8000
**Frontend:** ✅ http://localhost:3000
**API Docs:** ✅ http://localhost:8000/docs

**Now go train that ML model! 🚀**
```bash
./train_ml_model.sh
```
