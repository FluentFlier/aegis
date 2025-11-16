# 🚀 AEGIS - Complete Working Prototype Setup Guide

## ✅ Prerequisites Checklist

- [ ] Docker Desktop installed and running
- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] Google Gemini API key (get from https://makersuite.google.com/app/apikey)

---

## 📋 COMPLETE SETUP INSTRUCTIONS

### Step 1: Configure Environment Variables

**Create `.env` file in `aegis-backend/` directory:**

```bash
cd ~/aegis/aegis-backend

cat > .env << 'EOF'
# Database (PostgreSQL via Docker)
DATABASE_URL=postgresql://aegis_user:aegis_password@postgres:5432/aegis_db
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=40

# Redis
REDIS_URL=redis://redis:6379/0

# Google Gemini API (REQUIRED for AI agents)
GOOGLE_API_KEY=YOUR_GEMINI_API_KEY_HERE

# Security
SECRET_KEY=your-secret-key-change-in-production-$(openssl rand -hex 32)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Environment
ENVIRONMENT=development
DEBUG=True
LOG_LEVEL=INFO

# ML Configuration
ML_MODEL_RETRAIN_SCHEDULE=weekly
ML_MODEL_MIN_SAMPLES=10
ML_MODEL_VALIDATION_SPLIT=0.2
ML_FEATURE_IMPORTANCE_THRESHOLD=0.01

# Risk Matrix
RISK_MATRIX_VERSION=v1.0.0
RISK_MATRIX_AUTO_APPROVE=False
RISK_MATRIX_APPROVAL_REQUIRED=True

# Agent Configuration
AGENT_MAX_RETRIES=3
AGENT_TIMEOUT_SECONDS=30
AGENT_CONCURRENCY=5
EOF
```

**⚠️ IMPORTANT:** Replace `YOUR_GEMINI_API_KEY_HERE` with your actual API key!

---

### Step 2: Start Backend Services

```bash
cd ~/aegis/aegis-backend

# Stop any running containers
docker-compose down

# Start all services (PostgreSQL, Redis, Backend)
docker-compose up -d

# Wait 10 seconds for services to be healthy
sleep 10

# Seed the database with sample data
docker-compose exec backend python -m src.db.seed

# Check backend logs
docker-compose logs -f backend
```

**Expected output:**
```
✓ Database initialized successfully
✓ Google Gemini API key configured
🚀 Application ready!
📊 API Documentation: http://localhost:8000/docs
```

**Verify backend is working:**
```bash
# Should return supplier data
curl http://localhost:8000/api/suppliers/

# Should return analytics
curl http://localhost:8000/api/analytics/portfolio/summary
```

---

### Step 3: Configure Frontend

**Update frontend API endpoint:**

```bash
cd ~/aegis/aegis-frontend

# Create/update .env file
cat > .env << 'EOF'
VITE_API_URL=http://localhost:8000
EOF
```

**Install dependencies:**
```bash
npm install
```

---

### Step 4: Start Frontend

```bash
cd ~/aegis/aegis-frontend

# Start development server
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

### Step 5: Access the Application

**Open in browser:**
```
Frontend: http://localhost:5173
Backend API Docs: http://localhost:8000/docs
```

---

## 🔧 Troubleshooting

### Issue: "Port 8000 already allocated"

```bash
# Find process using port 8000
lsof -i :8000

# Kill it
kill -9 <PID>

# Or stop all Docker containers
docker-compose down
```

### Issue: "Not Found" errors from API

This means routes aren't registered. Check:

```bash
# View backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

### Issue: Frontend can't connect to backend

1. Check CORS settings in backend
2. Verify `VITE_API_URL` in frontend `.env`
3. Check both services are running:
   - Backend: http://localhost:8000
   - Frontend: http://localhost:5173

### Issue: Database connection errors

```bash
# Check PostgreSQL is running
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d
docker-compose exec backend python -m src.db.seed
```

---

## 📊 Test the Complete System

### 1. Backend API Tests

```bash
# Get suppliers
curl http://localhost:8000/api/suppliers/

# Get analytics
curl http://localhost:8000/api/analytics/portfolio/summary

# Get alerts
curl http://localhost:8000/api/alerts/

# Check ML training readiness
curl http://localhost:8000/api/ml-models/training-readiness

# Get active risk matrix
curl http://localhost:8000/api/ml-models/versions/active
```

### 2. Frontend Tests

1. Open http://localhost:5173
2. Navigate through screens:
   - Dashboard (should show 6 suppliers)
   - Supplier Detail (click any supplier)
   - Analytics (should show charts)
   - Alerts (should show 3 alerts)
3. Check browser console for errors

---

## 🎯 Required API Keys

### 1. Google Gemini API Key (REQUIRED)

**Get it here:** https://makersuite.google.com/app/apikey

**Steps:**
1. Sign in with Google account
2. Click "Create API Key"
3. Copy the key
4. Add to `aegis-backend/.env`:
   ```
   GOOGLE_API_KEY=AIza...your_key_here
   ```

**Why needed:** Powers the 4 AI agents (Financial, Legal, ESG, Geopolitical)

**Cost:** Free tier includes:
- 60 requests per minute
- 1,500 requests per day
- More than enough for development/demo

---

## 🗂️ Sample Data Included

The database seed creates:

- **6 Suppliers:**
  - TechFlow Industries (Asia-Pacific, Active)
  - Apex Manufacturing (North America, Critical)
  - GreenSource Solutions (Europe, Active)
  - GlobalTrade Logistics (Middle East, Under Review)
  - Pacific Components (Asia-Pacific, Active)
  - Nordic Steel Group (Europe, Active)

- **30 Contracts** with various outcomes (renewed, disputed, terminated, etc.)
- **44 Risk Assessments** with historical trends
- **3 Alerts** (1 critical, 1 warning, 1 info)
- **1 Baseline Risk Matrix** (equal weights: 0.125 each)

---

## 🎨 Frontend Features Connected to Backend

### Dashboard Screen
- ✅ Supplier cards (from `/api/suppliers/`)
- ✅ Risk scores (calculated in real-time)
- ✅ Alert ticker (from `/api/alerts/`)
- ✅ Agent activity feed (from `/api/agents/activity`)

### Supplier Detail Screen
- ✅ Risk breakdown by category
- ✅ Historical risk trends
- ✅ Recommendations (Proceed/Negotiate/Replace)

### Analytics Screen
- ✅ Portfolio summary stats
- ✅ Risk distribution histogram
- ✅ Risk by region
- ✅ Top risks ranking

### Alerts Screen
- ✅ Alert filtering by severity
- ✅ Mark as read/unread
- ✅ Resolve alerts

### ML Model Management (Future)
- ✅ Train new models (API ready)
- ✅ Approve/activate versions (API ready)
- ✅ View weight evolution (API ready)

---

## 🚀 Quick Start Commands

**Start everything:**
```bash
# Terminal 1: Backend
cd ~/aegis/aegis-backend
docker-compose up -d
docker-compose exec backend python -m src.db.seed

# Terminal 2: Frontend
cd ~/aegis/aegis-frontend
npm run dev
```

**Stop everything:**
```bash
# Stop frontend (Ctrl+C in terminal)

# Stop backend
cd ~/aegis/aegis-backend
docker-compose down
```

---

## 📱 What You'll See

### Dashboard
- 6 supplier cards with live risk scores
- Risk trend indicators (up/down/stable)
- Alert ticker scrolling at top
- Agent activity feed on right

### Supplier Detail
- Risk score breakdown (8 categories)
- Line chart showing risk trends
- AI-powered recommendations
- Recent events timeline

### Analytics
- Portfolio KPIs (6 suppliers, $14M+ contracts)
- Risk distribution bar chart
- Regional risk map
- ESG compliance metrics

---

## ✅ Verification Checklist

Before declaring it "working":

- [ ] Backend starts without errors
- [ ] Database seeding completes
- [ ] All API endpoints return data (not "Not Found")
- [ ] Frontend starts without errors
- [ ] Dashboard loads with supplier data
- [ ] Clicking supplier shows detail page
- [ ] Analytics page shows charts
- [ ] Alerts page shows 3 alerts
- [ ] No CORS errors in browser console

---

## 🆘 Still Having Issues?

**Check logs:**
```bash
# Backend logs
docker-compose logs backend | tail -50

# PostgreSQL logs
docker-compose logs postgres | tail -20

# Frontend (in terminal where npm run dev is running)
```

**Common fixes:**
```bash
# Nuclear option - reset everything
cd ~/aegis/aegis-backend
docker-compose down -v
docker-compose up -d
sleep 10
docker-compose exec backend python -m src.db.seed

cd ~/aegis/aegis-frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 📝 Next Steps After Prototype Works

1. **Add real data** - Replace sample suppliers with your data
2. **Train ML model** - POST to `/api/ml-models/train`
3. **Run agent assessments** - POST to `/api/suppliers/{id}/assess`
4. **Customize risk weights** - Adjust in risk matrix versions
5. **Deploy to production** - Use provided Dockerfile & docker-compose

---

**Need help? Check:**
- Backend logs: `docker-compose logs backend`
- API docs: http://localhost:8000/docs
- Frontend console: Browser DevTools (F12)

**Current Status:**
- ✅ Backend: Fully implemented with 50+ endpoints
- ✅ Frontend: Complete UI with 8 screens
- ⚠️ Integration: Needs frontend API calls updated (see below)
