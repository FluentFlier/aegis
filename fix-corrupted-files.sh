#!/bin/bash

# Aegis - Fix Corrupted Files
# Resets any corrupted source files to clean versions from git

echo "=========================================="
echo "   🔧 Fixing Corrupted Files"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

cd aegis-backend

echo -e "${BLUE}Checking for corrupted files...${NC}"

# Reset config.py to clean version from git
if git diff src/config.py | grep -q "python -m"; then
    echo -e "${RED}✗ config.py is corrupted${NC}"
    echo -e "${BLUE}Resetting to clean version...${NC}"
    git checkout src/config.py
    echo -e "${GREEN}✓ config.py fixed${NC}"
else
    echo -e "${GREEN}✓ config.py looks clean${NC}"
fi

cd ..

echo ""
echo -e "${BLUE}Installing missing pydantic-settings...${NC}"
cd aegis-backend
source venv/bin/activate

# Force install pydantic-settings
pip install pydantic-settings

if python -c "import pydantic_settings" 2>/dev/null; then
    echo -e "${GREEN}✓ pydantic-settings installed successfully${NC}"
else
    echo -e "${RED}✗ Failed to install pydantic-settings${NC}"
    exit 1
fi

cd ..

echo ""
echo "=========================================="
echo -e "   ${GREEN}✅ Files Fixed!${NC}"
echo "=========================================="
echo ""
echo "Now you can run: ${GREEN}./start.sh${NC}"
echo ""
