#!/bin/bash

echo "🔄 Restarting Aegis Backend..."
echo ""

# Kill existing backend process
echo "1️⃣ Killing existing backend on port 8000..."
if lsof -ti:8000 > /dev/null 2>&1; then
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    echo "   ✅ Killed old backend process"
else
    echo "   ℹ️  No existing backend process found"
fi

sleep 1

# Navigate to backend directory
cd "$(dirname "$0")/aegis-backend" || exit 1

# Activate virtual environment
echo ""
echo "2️⃣ Activating virtual environment..."
source venv/bin/activate || {
    echo "   ❌ Failed to activate venv. Run: cd aegis-backend && python -m venv venv"
    exit 1
}
echo "   ✅ Virtual environment activated"

# Start backend
echo ""
echo "3️⃣ Starting backend server..."
echo "   📍 http://localhost:8000"
echo "   📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop"
echo "========================================"
echo ""

uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
