# Aegis - Quick Start Guide

Your complete AI-powered supply chain risk management platform is **ready to use**!

## 🎉 Current Status

✅ **Backend**: Running on http://localhost:8000
✅ **Frontend**: Running on http://localhost:3000
✅ **Database**: Initialized with sample data (6 suppliers, 30 contracts, 44 risk assessments)
✅ **API**: All 50+ endpoints operational
✅ **AI Agents**: 8 specialized agents ready (Gemini API configured)

---

## 🚀 Access Your Application

### Frontend Dashboard
Open your browser and visit:
```
http://localhost:3000
```

### API Documentation
Interactive API documentation available at:
```
http://localhost:8000/docs          (Swagger UI)
http://localhost:8000/redoc         (ReDoc)
```

---

## 📊 Sample Data Loaded

The system comes pre-loaded with realistic sample data:

### Suppliers (6)
1. **TechFlow Industries** - Electronics Manufacturing (China) - Risk: 27.6
2. **Apex Manufacturing Co** - Heavy Machinery (USA) - Risk: 67.6 ⚠️
3. **GreenSource Solutions** - Sustainable Materials (Germany) - Risk: 20.6
4. **GlobalTrade Logistics** - Logistics (UAE) - Risk: 54.4
5. **Pacific Components Ltd** - Electronics (South Korea) - Risk: 33.4
6. **Nordic Steel Group** - Raw Materials (Sweden) - Risk: 21.1

### Contracts (30)
- Mix of successful, disputed, terminated, and renewed contracts
- **Ready for ML training** (30 contracts with outcomes vs. 10 minimum required)

### Alerts (3)
- 1 Critical: Legal risk spike for Apex Manufacturing
- 1 Warning: Delayed shipment for GlobalTrade
- 1 Info: Financial update for TechFlow

---

## 🔑 Environment Configuration

### Backend (.env)
Located at: `aegis-backend/.env`

```bash
# Database
DATABASE_URL=sqlite:///./aegis.db

# Google Gemini API (Required for AI Agents)
GOOGLE_API_KEY=<your-gemini-api-key>

# ML Configuration
ML_MODEL_MIN_SAMPLES=10
RISK_MATRIX_AUTO_APPROVE=False

# App Configuration
DEBUG=True
ENVIRONMENT=development
ALLOWED_ORIGINS=["http://localhost:3000","http://localhost:5173"]
```

**Important**: Get your free Gemini API key at: https://makersuite.google.com/app/apikey

### Frontend (.env)
Located at: `aegis-frontend/.env`

```bash
# Backend API URL
VITE_API_URL=http://localhost:8000
```

---

## 🧪 Test the System

### 1. View Suppliers
```bash
curl http://localhost:8000/api/suppliers/ | python3 -m json.tool
```

### 2. Run Risk Assessment (AI Agents)
```bash
curl -X POST http://localhost:8000/api/suppliers/1/assess | python3 -m json.tool
```

### 3. Train ML Model
```bash
curl -X POST http://localhost:8000/api/ml-models/train \
  -H "Content-Type: application/json" \
  -d '{"model_type": "logistic_regression"}' | python3 -m json.tool
```

### 4. View Portfolio Analytics
```bash
curl http://localhost:8000/api/analytics/portfolio/summary | python3 -m json.tool
```

### 5. Get Active Risk Matrix Version
```bash
curl http://localhost:8000/api/ml-models/versions/active | python3 -m json.tool
```

---

## 🎯 Key Features to Try

### 1. Adaptive ML Learning System
The core innovation of Aegis - learns optimal risk weights from contract outcomes.

**Workflow:**
1. Check training readiness: `GET /api/ml-models/training-readiness`
2. Train new model: `POST /api/ml-models/train`
3. Review results: `GET /api/ml-models/versions/{id}`
4. Compare versions: `GET /api/ml-models/versions/compare?version_1_id=1&version_2_id=2`
5. Approve: `POST /api/ml-models/versions/{id}/approve`
6. Activate: `POST /api/ml-models/versions/{id}/activate`
7. Rollback if needed: `POST /api/ml-models/versions/{id}/rollback`

### 2. Multi-Agent Risk Assessment
8 specialized AI agents analyze different risk dimensions:

- **Financial Agent**: Cash flow, liquidity, creditworthiness
- **Legal Agent**: Regulatory compliance, litigation risks
- **ESG Agent**: Environmental, social, governance metrics
- **Geopolitical Agent**: Political stability, trade risks
- **Operational Agent**: Delivery reliability, capacity
- **Pricing Agent**: Cost competitiveness
- **Social Agent**: Labor practices, community impact
- **Performance Agent**: Quality metrics, historical data

**Run full assessment:**
```bash
curl -X POST http://localhost:8000/api/suppliers/1/assess
```

### 3. Real-Time Alerts
Monitor critical events and risk changes:

```bash
# Get all alerts
curl http://localhost:8000/api/alerts/

# Filter by severity
curl "http://localhost:8000/api/alerts/?severity=critical"

# Mark as read
curl -X PATCH http://localhost:8000/api/alerts/1/mark-read
```

### 4. Portfolio Analytics
Comprehensive dashboards and reporting:

```bash
# Portfolio summary
curl http://localhost:8000/api/analytics/portfolio/summary

# Risk distribution
curl http://localhost:8000/api/analytics/risk-distribution

# Risk by region
curl http://localhost:8000/api/analytics/risk-by-region

# Top risks
curl http://localhost:8000/api/analytics/top-risks
```

---

## 🛠️ Managing the Application

### Start Backend
```bash
cd aegis-backend
source venv/bin/activate
uvicorn src.main:app --reload --port 8000
```

### Start Frontend
```bash
cd aegis-frontend
npm run dev
```

### Stop Services
```bash
# Kill backend
pkill -f "uvicorn src.main:app"

# Kill frontend (Ctrl+C in the terminal)
```

### Reset Database
```bash
cd aegis-backend
rm aegis.db
python -m src.db.seed
```

---

## 📚 Architecture Overview

### Backend Stack
- **Framework**: FastAPI (Python 3.11+)
- **Database**: SQLite (dev) / PostgreSQL (production)
- **AI/ML**:
  - Google Gemini 1.5 Flash (agent intelligence)
  - Scikit-learn (adaptive learning)
- **ORM**: SQLAlchemy
- **Validation**: Pydantic

### Frontend Stack
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite with SWC
- **UI**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **API Client**: Custom TypeScript service layer

### Database Schema
- **suppliers**: Supplier profiles
- **contracts**: Contract details with outcomes
- **risk_assessments**: Historical risk scores
- **risk_matrix_versions**: ML-generated weight versions
- **alerts**: Real-time notifications
- **agent_activities**: Agent execution logs

---

## 🔍 Troubleshooting

### Backend not responding
```bash
# Check if running
ps aux | grep uvicorn

# Check logs
cd aegis-backend
tail -f logs/app.log

# Restart
pkill -f uvicorn
uvicorn src.main:app --reload --port 8000
```

### Frontend not loading
```bash
# Check if running
ps aux | grep vite

# Reinstall dependencies
cd aegis-frontend
rm -rf node_modules
npm install
npm run dev
```

### Database errors
```bash
# Reset and reseed
cd aegis-backend
rm aegis.db
python -m src.db.seed
```

### API connection errors
1. Verify backend is running: `curl http://localhost:8000/health`
2. Check CORS settings in `aegis-backend/src/config.py`
3. Verify `VITE_API_URL` in `aegis-frontend/.env`

---

## 📈 Next Steps

### Customize Risk Weights
Train a new ML model to adapt weights based on your contract outcomes:

1. Add more contracts with outcomes to the database
2. Check training readiness
3. Train new model with your preferred algorithm:
   - `logistic_regression` (fast, interpretable)
   - `random_forest` (robust, handles non-linearity)
   - `gradient_boosting` (highest accuracy)
4. Review and approve new weights
5. Activate to apply across all assessments

### Deploy to Production
See `SETUP_GUIDE.md` for Docker deployment instructions and production checklist.

### Integrate with Your Systems
The API is fully RESTful and can be integrated with:
- ERP systems
- Procurement platforms
- BI dashboards
- Custom applications

---

## 🎓 Resources

- **API Documentation**: http://localhost:8000/docs
- **Frontend Code**: `aegis-frontend/src/`
- **Backend Code**: `aegis-backend/src/`
- **Database Models**: `aegis-backend/src/db/models.py`
- **Agent Logic**: `aegis-backend/src/agents/orchestrator.py`
- **ML Service**: `aegis-backend/src/services/ml_training_service.py`

---

## 💡 Tips

1. **Start with baseline weights**: The system starts with equal weights (0.125 each). Train a model once you have enough contract outcomes.

2. **Monitor agent activity**: Check `GET /api/agents/activity` to see what the AI agents are analyzing.

3. **Use version control**: Never lose old risk weights - all versions are saved and can be rolled back.

4. **Set thresholds**: Customize risk score thresholds in the frontend to match your risk appetite.

5. **Automate assessments**: Set up periodic assessments using cron jobs or scheduled tasks.

---

## 🚀 You're All Set!

Your complete working prototype is ready. Visit http://localhost:3000 to start exploring the dashboard!

For questions or issues, check the troubleshooting section above or review the detailed setup guide in `SETUP_GUIDE.md`.

**Happy risk managing! 📊🔒**
