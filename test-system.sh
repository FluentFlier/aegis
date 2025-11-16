#!/bin/bash

# Aegis - System Integration Test Script
# Tests all major API endpoints and features

echo "=========================================="
echo "   🧪 Testing Aegis Platform"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0

# Helper function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}

    echo -n "Testing $name... "
    response=$(curl -s -w "\n%{http_code}" "$url")
    status_code=$(echo "$response" | tail -n 1)

    if [ "$status_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL (got $status_code, expected $expected_code)${NC}"
        ((FAILED++))
        return 1
    fi
}

# Helper function to test JSON response
test_json_field() {
    local name=$1
    local url=$2
    local field=$3

    echo -n "Testing $name... "
    response=$(curl -s "$url")
    value=$(echo "$response" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('$field', 'NOTFOUND'))" 2>/dev/null)

    if [ "$value" != "NOTFOUND" ] && [ -n "$value" ]; then
        echo -e "${GREEN}✓ PASS${NC} ($field: $value)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (field '$field' not found or empty)"
        ((FAILED++))
        return 1
    fi
}

echo -e "${BLUE}=== Backend Health ===${NC}"
test_endpoint "Health Check" "http://localhost:8000/health"
test_json_field "Database Status" "http://localhost:8000/health" "database"
echo ""

echo -e "${BLUE}=== Supplier API ===${NC}"
test_endpoint "List Suppliers" "http://localhost:8000/api/suppliers/"
test_endpoint "Get Supplier #1" "http://localhost:8000/api/suppliers/1"
test_endpoint "Supplier Risk Breakdown" "http://localhost:8000/api/suppliers/1/risk-breakdown"
echo ""

echo -e "${BLUE}=== Analytics API ===${NC}"
test_endpoint "Portfolio Summary" "http://localhost:8000/api/analytics/portfolio/summary"
test_json_field "Total Suppliers" "http://localhost:8000/api/analytics/portfolio/summary" "total_suppliers"
test_endpoint "Risk Distribution" "http://localhost:8000/api/analytics/risk-distribution"
test_endpoint "Risk by Region" "http://localhost:8000/api/analytics/risk-by-region"
echo ""

echo -e "${BLUE}=== Alerts API ===${NC}"
test_endpoint "List Alerts" "http://localhost:8000/api/alerts/"
test_endpoint "Alert Stats" "http://localhost:8000/api/alerts/stats"
echo ""

echo -e "${BLUE}=== ML Models API ===${NC}"
test_endpoint "Active Risk Matrix" "http://localhost:8000/api/ml-models/versions/active"
test_endpoint "Training Readiness" "http://localhost:8000/api/ml-models/training-readiness"
test_json_field "ML Ready Status" "http://localhost:8000/api/ml-models/training-readiness" "is_ready"
echo ""

echo -e "${BLUE}=== Agent API ===${NC}"
test_endpoint "Agent Activity" "http://localhost:8000/api/agents/activity"
test_endpoint "Agent Stats" "http://localhost:8000/api/agents/stats"
echo ""

echo -e "${BLUE}=== Frontend ===${NC}"
test_endpoint "Frontend Homepage" "http://localhost:3000"
echo ""

echo "=========================================="
echo -e "   ${GREEN}Test Results${NC}"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}⚠  Some tests failed. Check the output above.${NC}"
    exit 1
fi
