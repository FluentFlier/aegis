#!/bin/bash

# Aegis - Complete Cleanup Script
# Stops all conflicting services and prepares for fresh start

echo "=========================================="
echo "   🧹 Cleaning Up Aegis Environment"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Stop Docker containers on port 8000
echo -e "${BLUE}Checking for Docker containers on port 8000...${NC}"
if command -v docker &> /dev/null; then
    # Find containers using port 8000
    CONTAINERS=$(docker ps --format '{{.ID}} {{.Ports}}' | grep '8000' | awk '{print $1}')

    if [ -n "$CONTAINERS" ]; then
        echo -e "${YELLOW}Found Docker containers on port 8000:${NC}"
        docker ps | grep '8000'
        echo ""
        echo -e "${YELLOW}Stopping containers...${NC}"
        echo "$CONTAINERS" | xargs docker stop
        echo -e "${GREEN}✓ Docker containers stopped${NC}"
    else
        echo -e "${GREEN}✓ No Docker containers on port 8000${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Docker not found, skipping...${NC}"
fi

# Step 2: Kill any Python/uvicorn processes on port 8000
echo ""
echo -e "${BLUE}Stopping Python/uvicorn processes...${NC}"
pkill -f "uvicorn.*8000" 2>/dev/null && echo -e "${GREEN}✓ Stopped uvicorn${NC}" || echo "  (No uvicorn running)"
pkill -f "python.*8000" 2>/dev/null && echo -e "${GREEN}✓ Stopped Python processes${NC}" || echo "  (No Python processes on 8000)"

# Step 3: Kill frontend processes
echo ""
echo -e "${BLUE}Stopping frontend processes...${NC}"
pkill -f "vite" 2>/dev/null && echo -e "${GREEN}✓ Stopped Vite${NC}" || echo "  (No Vite running)"
pkill -f "npm.*dev" 2>/dev/null && echo -e "${GREEN}✓ Stopped npm dev${NC}" || echo "  (No npm dev running)"

# Step 4: Clean old database
echo ""
echo -e "${BLUE}Cleaning old database...${NC}"
if [ -f "aegis-backend/aegis.db" ]; then
    rm aegis-backend/aegis.db
    echo -e "${GREEN}✓ Removed old database${NC}"
else
    echo "  (No old database found)"
fi

if [ -f "aegis-backend/aegis_test.db" ]; then
    rm aegis-backend/aegis_test.db
    echo -e "${GREEN}✓ Removed test database${NC}"
fi

# Step 5: Clear Python cache
echo ""
echo -e "${BLUE}Clearing Python cache...${NC}"
find aegis-backend -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find aegis-backend -type f -name "*.pyc" -delete 2>/dev/null
echo -e "${GREEN}✓ Python cache cleared${NC}"

# Step 6: Verify ports are free
echo ""
echo -e "${BLUE}Verifying ports are free...${NC}"
if lsof -i :8000 > /dev/null 2>&1; then
    echo -e "${RED}✗ Port 8000 still in use:${NC}"
    lsof -i :8000
    echo ""
    echo -e "${YELLOW}Run: sudo lsof -ti:8000 | xargs kill -9${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Port 8000 is free${NC}"
fi

if lsof -i :3000 > /dev/null 2>&1; then
    echo -e "${RED}✗ Port 3000 still in use:${NC}"
    lsof -i :3000
    echo ""
    echo -e "${YELLOW}Run: sudo lsof -ti:3000 | xargs kill -9${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Port 3000 is free${NC}"
fi

echo ""
echo "=========================================="
echo -e "   ${GREEN}✅ Cleanup Complete!${NC}"
echo "=========================================="
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Run: ${GREEN}./start.sh${NC} to start with fresh data"
echo "2. Or manually:"
echo "   cd aegis-backend && source venv/bin/activate"
echo "   python -m src.db.seed"
echo "   uvicorn src.main:app --reload"
echo ""
