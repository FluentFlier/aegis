#!/bin/bash

# Aegis Backend - Quick Setup and Dependency Install
# Fixes missing dependencies and ensures venv is properly configured

echo "=========================================="
echo "   🔧 Setting Up Aegis Backend"
echo "=========================================="
echo ""

cd aegis-backend

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check Python version
echo -e "${BLUE}Checking Python version...${NC}"
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}' | cut -d. -f1,2)
echo "Python version: $PYTHON_VERSION"

if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${GREEN}✓ Virtual environment exists${NC}"
fi

echo ""
echo -e "${BLUE}Activating virtual environment...${NC}"
source venv/bin/activate

echo -e "${BLUE}Upgrading pip...${NC}"
pip install --upgrade pip > /dev/null 2>&1

echo ""
echo -e "${BLUE}Installing dependencies from requirements.txt...${NC}"
echo "(This may take a minute...)"
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ All dependencies installed successfully!${NC}"
else
    echo -e "${RED}✗ Error installing dependencies${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Verifying critical packages...${NC}"
python -c "import pydantic_settings; print('✓ pydantic-settings installed')"
python -c "import fastapi; print('✓ FastAPI installed')"
python -c "import sqlalchemy; print('✓ SQLAlchemy installed')"
python -c "import google.generativeai; print('✓ Google Generative AI installed')"

echo ""
echo -e "${BLUE}Checking .env file...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env created${NC}"
    echo -e "${YELLOW}⚠  Please edit .env and add your Google Gemini API key!${NC}"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

echo ""
echo -e "${BLUE}Seeding database with real data...${NC}"
python -m src.db.seed

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database seeded successfully!${NC}"
else
    echo -e "${RED}✗ Error seeding database${NC}"
    exit 1
fi

echo ""
echo "=========================================="
echo -e "   ${GREEN}✅ Setup Complete!${NC}"
echo "=========================================="
echo ""
echo -e "${BLUE}Backend is ready. To start:${NC}"
echo "  cd aegis-backend"
echo "  source venv/bin/activate"
echo "  uvicorn src.main:app --reload"
echo ""
echo -e "${BLUE}Or from project root:${NC}"
echo "  ./start.sh"
echo ""
