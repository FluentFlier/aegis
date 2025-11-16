#!/bin/bash

# Aegis - Complete System Startup Script
# This script starts both backend and frontend services

set -e

echo "=========================================="
echo "   🚀 Starting Aegis Platform"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend virtual environment exists
if [ ! -d "aegis-backend/venv" ]; then
    echo -e "${YELLOW}⚠  Backend virtual environment not found. Creating...${NC}"
    cd aegis-backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
    echo -e "${GREEN}✓ Virtual environment created${NC}"
fi

# Check if frontend dependencies are installed
if [ ! -d "aegis-frontend/node_modules" ]; then
    echo -e "${YELLOW}⚠  Frontend dependencies not found. Installing...${NC}"
    cd aegis-frontend
    npm install
    cd ..
    echo -e "${GREEN}✓ Dependencies installed${NC}"
fi

# Kill any existing processes
echo -e "${BLUE}Stopping any existing services...${NC}"
pkill -f "uvicorn src.main:app" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2

# Create logs directory
mkdir -p logs

# Start Backend
echo -e "${BLUE}Starting Backend API...${NC}"
cd aegis-backend
source venv/bin/activate
nohup uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"

# Wait for backend to be ready
echo -e "${BLUE}Waiting for backend to initialize...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is healthy!${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}⚠  Backend taking longer than expected. Check logs/backend.log${NC}"
    fi
done

# Start Frontend
echo -e "${BLUE}Starting Frontend...${NC}"
cd aegis-frontend
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"

# Wait for frontend to be ready
echo -e "${BLUE}Waiting for frontend to initialize...${NC}"
for i in {1..20}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend is ready!${NC}"
        break
    fi
    sleep 1
done

echo ""
echo "=========================================="
echo -e "   ${GREEN}✅ Aegis Platform is Running!${NC}"
echo "=========================================="
echo ""
echo -e "${BLUE}Backend API:${NC}       http://localhost:8000"
echo -e "${BLUE}API Docs:${NC}          http://localhost:8000/docs"
echo -e "${BLUE}Frontend Dashboard:${NC} http://localhost:3000"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo "  Backend:  logs/backend.log"
echo "  Frontend: logs/frontend.log"
echo ""
echo -e "${YELLOW}To view logs:${NC}"
echo "  tail -f logs/backend.log"
echo "  tail -f logs/frontend.log"
echo ""
echo -e "${YELLOW}To stop services:${NC}"
echo "  ./stop.sh"
echo ""
echo "=========================================="
echo -e "   ${GREEN}Happy Risk Managing! 📊🔒${NC}"
echo "=========================================="
