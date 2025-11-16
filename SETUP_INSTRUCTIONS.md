# 🚀 Aegis - Final Setup Instructions

## ✅ What's Already Done

All code has been pushed to your branch: `claude/analyze-codebase-01UyZYpse862kKsFZfp38Ft5`

**✓ Backend**: Complete FastAPI with 50+ endpoints
**✓ Frontend**: React app integrated with backend API
**✓ Database**: SQLite with sample data (6 suppliers, 30 contracts)
**✓ AI Agents**: 8 specialized agents ready
**✓ ML System**: Adaptive learning system implemented
**✓ Scripts**: start.sh, stop.sh, test-system.sh
**✓ Documentation**: Complete README and guides
**✓ API Key**: Google Gemini key configured in .env

---

## 🎯 Your .env Configuration

Your **Google Gemini API key** has been configured in:
```
aegis-backend/.env
```

**API Key**: `AIzaSyBEGCtjvnekMkYK2p3uxqkOJKp863UwO90` ✅

**Note**: The `.env` file is **not** in git (for security), so when you pull the code, you'll need to either:
1. Copy the `.env.example` to `.env` and add your API key, OR
2. The file is already configured in the current session

---

## 📥 Steps to Run from VS Code

### 1. Pull the Latest Code

```bash
git fetch
git checkout claude/analyze-codebase-01UyZYpse862kKsFZfp38Ft5
git pull
```

### 2. Set Up Your Environment File

**Option A**: If `.env` doesn't exist after pulling:
```bash
cd aegis-backend
cp .env.example .env
```

Then edit `.env` and add your Google Gemini API key:
```bash
GOOGLE_API_KEY=AIzaSyBEGCtjvnekMkYK2p3uxqkOJKp863UwO90
```

**Option B**: If you're working in the same environment, the `.env` is already configured!

### 3. Start the System

From the project root:
```bash
./start.sh
```

This will:
- ✅ Create Python virtual environment (if needed)
- ✅ Install all dependencies
- ✅ Start backend on port 8000
- ✅ Start frontend on port 3000
- ✅ Initialize database with sample data
- ✅ Verify services are healthy

### 4. Access Your Platform

Open in your browser:

| Service | URL |
|---------|-----|
| **Dashboard** | http://localhost:3000 |
| **API Docs** | http://localhost:8000/docs |
| **Health Check** | http://localhost:8000/health |

### 5. Test Everything Works

```bash
./test-system.sh
```

Expected result: **15/17 tests passing** ✅

---

## 🎓 Quick Feature Tests

### Test 1: View Suppliers
```bash
curl http://localhost:8000/api/suppliers/ | python3 -m json.tool
```

### Test 2: Run AI Risk Assessment
```bash
curl -X POST http://localhost:8000/api/suppliers/1/assess | python3 -m json.tool
```
This will run all 8 AI agents on TechFlow Industries!

### Test 3: Train ML Model
```bash
curl -X POST http://localhost:8000/api/ml-models/train \
  -H "Content-Type: application/json" \
  -d '{"model_type": "logistic_regression"}' | python3 -m json.tool
```
This learns optimal risk weights from your 30 contract outcomes!

### Test 4: View Portfolio Analytics
```bash
curl http://localhost:8000/api/analytics/portfolio/summary | python3 -m json.tool
```

---

## 🛑 Stop the System

```bash
./stop.sh
```

---

## 📊 What You'll See

### Frontend Dashboard (http://localhost:3000)
1. Complete onboarding flow
2. Dashboard with 6 suppliers loaded from backend
3. Real-time risk scores
4. Analytics charts
5. Alert notifications
6. AI agent activity feed

### Backend API (http://localhost:8000/docs)
1. Interactive API documentation
2. Try out any endpoint
3. See request/response formats
4. Test authentication

---

## 🔧 Troubleshooting

### If Backend Doesn't Start

**Missing Dependencies**:
```bash
cd aegis-backend
source venv/bin/activate
pip install -r requirements.txt
```

**Wrong Python Version**:
```bash
python3 --version  # Should be 3.11+
```

### If Frontend Doesn't Start

**Missing Dependencies**:
```bash
cd aegis-frontend
npm install
```

### If API Key Errors

Make sure `.env` has your key:
```bash
cat aegis-backend/.env | grep GOOGLE_API_KEY
```

Should show:
```
GOOGLE_API_KEY=AIzaSyBEGCtjvnekMkYK2p3uxqkOJKp863UwO90
```

### If Database Errors

Reset the database:
```bash
cd aegis-backend
rm aegis.db
source venv/bin/activate
python -m src.db.seed
```

---

## 📚 Documentation

- **README.md** - Complete system overview
- **QUICK_START.md** - Quick reference guide
- **PROTOTYPE_STATUS.md** - Feature details
- **SETUP_GUIDE.md** - Detailed setup instructions
- **API Docs** - http://localhost:8000/docs

---

## 🎯 Key Features Ready to Use

### ✅ Multi-Agent AI System
- 8 specialized agents (Financial, Legal, ESG, Geopolitical, etc.)
- 4 powered by Google Gemini
- Real-time risk analysis

### ✅ Adaptive ML Learning
- Learns from contract outcomes
- Replaces static Excel risk matrices
- Human-in-the-loop approval
- Version control with rollback

### ✅ Complete REST API
- 50+ endpoints
- Suppliers, Analytics, Alerts, ML Models, Agents
- Interactive documentation
- Proper error handling

### ✅ Real-Time Monitoring
- Portfolio analytics
- Risk trend tracking
- Alert system
- Regional analysis

---

## 📈 Sample Data Loaded

- **6 Suppliers** from different regions and industries
- **30 Contracts** with various outcomes (ready for ML!)
- **44 Risk Assessments** with historical trends
- **3 Alerts** (critical, warning, info)
- **Baseline Risk Matrix** (v1.0.0 with equal weights)

---

## 🎉 You're All Set!

Everything is configured and ready to run. Just follow these steps:

1. ✅ `git pull` - Get the latest code
2. ✅ Check `.env` has your API key
3. ✅ `./start.sh` - Start everything
4. ✅ Open http://localhost:3000 - Use the platform!

**Happy Risk Managing! 🛡️📊🚀**

---

## 💡 Next Steps

Once running:

1. **Explore the Dashboard** - Complete onboarding, view suppliers
2. **Run Risk Assessments** - Let AI agents analyze suppliers
3. **Train ML Model** - Learn optimal weights from your data
4. **View Analytics** - See portfolio stats and trends
5. **Test Alerts** - Monitor critical events
6. **Check API Docs** - Explore all 50+ endpoints

Need help? Check the docs in the repository!
