# 🔧 Aegis Troubleshooting Guide

## Problem: Port 8000 Returns "Not Found"

This usually means there's a conflicting Docker container or old backend running on port 8000.

### Solution: Complete Cleanup and Fresh Start

#### Step 1: Run the Cleanup Script

```bash
./cleanup.sh
```

This will:
- ✅ Stop all Docker containers on port 8000
- ✅ Kill any uvicorn/Python processes
- ✅ Stop frontend processes
- ✅ Remove old database
- ✅ Clear Python cache
- ✅ Verify ports are free

#### Step 2: Manual Docker Cleanup (if needed)

If cleanup.sh doesn't stop Docker:

```bash
# List all running containers
docker ps

# Stop specific container
docker stop <container_id>

# Or stop all containers
docker stop $(docker ps -q)

# Remove containers on port 8000
docker ps | grep 8000
docker stop <container_id>
docker rm <container_id>
```

#### Step 3: Force Kill Processes on Port 8000 (if needed)

If port 8000 is still in use:

```bash
# Find what's using port 8000
sudo lsof -ti:8000

# Kill it
sudo lsof -ti:8000 | xargs kill -9
```

#### Step 4: Start Fresh with Real Data

```bash
./start.sh
```

This will:
- ✅ Create fresh database
- ✅ Seed with **real data** (6 suppliers, 30 contracts)
- ✅ Start backend on port 8000
- ✅ Start frontend on port 3000

---

## Verifying Real Data vs Mock Data

### ✅ Real Data (What You Should See)

After running `./start.sh`, your backend uses **real database data**:

**Test it:**
```bash
# Should return 6 real suppliers from database
curl http://localhost:8000/api/suppliers/ | python3 -m json.tool

# Should show database is healthy
curl http://localhost:8000/health
```

**Real Suppliers in Database:**
1. TechFlow Industries (China) - Electronics
2. Apex Manufacturing Co (USA) - Heavy Machinery
3. GreenSource Solutions (Germany) - Sustainable Materials
4. GlobalTrade Logistics (UAE) - Logistics
5. Pacific Components Ltd (South Korea) - Electronics
6. Nordic Steel Group (Sweden) - Raw Materials

**Real Contracts:** 30 contracts with actual outcomes for ML training

**Real Risk Assessments:** 44 historical risk scores

### ❌ Mock Data (Frontend Only - Fallback)

The frontend has mock data **only as a fallback** if backend is unreachable. This is in:
- `aegis-frontend/src/data/mockData.ts` (used only when API fails)

**When it's used:**
- Backend is down
- API request fails
- User sees "Failed to load data from backend. Using demo mode." toast

---

## Common Issues

### Issue: "{"detail":"Not Found"}" on localhost:8000

**Cause:** Wrong backend running or no routes registered

**Solution:**
```bash
./cleanup.sh
./start.sh

# Verify routes are loaded
curl http://localhost:8000/api/suppliers/
curl http://localhost:8000/docs  # Should show API documentation
```

### Issue: Backend starts but API returns errors

**Cause:** Database not seeded

**Solution:**
```bash
cd aegis-backend
rm aegis.db  # Remove old database
source venv/bin/activate
python -m src.db.seed  # Seed with real data
uvicorn src.main:app --reload
```

### Issue: Frontend shows "Failed to load data from backend"

**Cause:** Backend not running or wrong URL

**Check:**
```bash
# Backend should return healthy
curl http://localhost:8000/health

# Should return data
curl http://localhost:8000/api/suppliers/
```

**Fix .env:**
```bash
# Check frontend .env
cat aegis-frontend/.env
# Should show:
VITE_API_URL=http://localhost:8000
```

### Issue: Google Gemini API errors

**Cause:** API key not configured

**Solution:**
```bash
# Check backend .env
cat aegis-backend/.env | grep GOOGLE_API_KEY

# Should show:
GOOGLE_API_KEY=AIzaSyBEGCtjvnekMkYK2p3uxqkOJKp863UwO90

# If not, edit .env:
nano aegis-backend/.env
# Add:
GOOGLE_API_KEY=AIzaSyBEGCtjvnekMkYK2p3uxqkOJKp863UwO90
```

---

## Reset Everything to Factory Fresh

If nothing works, complete reset:

```bash
# 1. Stop everything
./stop.sh

# 2. Clean everything
./cleanup.sh

# 3. Remove ALL data
rm -rf aegis-backend/aegis.db
rm -rf aegis-backend/aegis_test.db
rm -rf aegis-backend/venv
rm -rf aegis-frontend/node_modules
rm -rf logs/

# 4. Fresh install
cd aegis-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cd ../aegis-frontend
npm install

cd ..

# 5. Create .env files
cp aegis-backend/.env.example aegis-backend/.env
# Edit and add your API key

# 6. Start fresh
./start.sh
```

---

## Checking What's Running

```bash
# Check backend
curl http://localhost:8000/health

# Check frontend
curl http://localhost:3000

# Check processes
ps aux | grep uvicorn
ps aux | grep vite

# Check ports
lsof -i :8000
lsof -i :3000

# Check Docker
docker ps
docker ps -a | grep 8000
```

---

## Database Commands

### View Database Contents

```bash
cd aegis-backend
sqlite3 aegis.db

# In sqlite prompt:
.tables                          # List all tables
SELECT * FROM suppliers;         # View suppliers
SELECT * FROM contracts;         # View contracts
SELECT * FROM risk_assessments;  # View risk scores
.quit
```

### Reseed Database

```bash
cd aegis-backend
rm aegis.db
source venv/bin/activate
python -m src.db.seed
```

### Check Database Health

```bash
cd aegis-backend
source venv/bin/activate
python << EOF
from src.db.database import SessionLocal
from src.db.models import Supplier
db = SessionLocal()
suppliers = db.query(Supplier).all()
print(f"Found {len(suppliers)} suppliers in database")
for s in suppliers:
    print(f"  - {s.name} ({s.region})")
db.close()
EOF
```

---

## Logs

Check logs for errors:

```bash
# Backend logs
tail -f logs/backend.log

# Frontend logs
tail -f logs/frontend.log

# Live debugging
cd aegis-backend
source venv/bin/activate
uvicorn src.main:app --reload --log-level debug
```

---

## Testing

Run integration tests:

```bash
./test-system.sh
```

Expected: **15/17 tests passing**

If tests fail:
1. Check backend is running: `curl http://localhost:8000/health`
2. Check database has data: `curl http://localhost:8000/api/suppliers/`
3. Check logs for errors: `tail logs/backend.log`

---

## Still Having Issues?

1. Check you're in the correct directory: `pwd` should show `.../aegis`
2. Check Python version: `python3 --version` (need 3.11+)
3. Check Node version: `node --version` (need 18+)
4. Run cleanup and start fresh: `./cleanup.sh && ./start.sh`
5. Check all environment variables in `aegis-backend/.env`
6. Verify no other services are using ports 8000 or 3000

---

## Quick Reference

| Problem | Solution |
|---------|----------|
| Port 8000 in use | `./cleanup.sh` |
| Database empty | `cd aegis-backend && python -m src.db.seed` |
| API returns 404 | Check `curl http://localhost:8000/docs` |
| Frontend can't connect | Check `aegis-frontend/.env` has correct API URL |
| Gemini API errors | Check `aegis-backend/.env` has API key |
| Tests failing | `./cleanup.sh && ./start.sh && ./test-system.sh` |

---

**For most issues: `./cleanup.sh` then `./start.sh` will fix it! 🎯**
