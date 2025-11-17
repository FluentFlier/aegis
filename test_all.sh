#!/bin/bash

echo "🔍 Testing Aegis Integration..."
echo ""

echo "1️⃣ Backend Health:"
curl -s http://localhost:8000/health | python -m json.tool || echo "❌ Backend not responding"
echo ""

echo "2️⃣ Suppliers Count:"
SUPPLIER_COUNT=$(curl -s http://localhost:8000/api/suppliers/ 2>/dev/null | python -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null)
if [ -n "$SUPPLIER_COUNT" ]; then
    echo "   ✅ Found: $SUPPLIER_COUNT suppliers"
else
    echo "   ❌ Failed to fetch suppliers"
fi
echo ""

echo "3️⃣ Active ML Model:"
curl -s http://localhost:8000/api/ml-models/versions/active 2>/dev/null | python -c "import sys, json; data=json.load(sys.stdin); print('   Version:', data.get('version', 'None')); print('   Legal Weight:', round(data.get('weights', {}).get('legal', 0) * 100, 1), '%')" 2>/dev/null || echo "   ❌ No active model"
echo ""

echo "4️⃣ Contract Risk Assessments:"
ASSESSMENT_COUNT=$(curl -s http://localhost:8000/api/suppliers/1/assessments 2>/dev/null | python -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null)
if [ -n "$ASSESSMENT_COUNT" ]; then
    echo "   ✅ Found: $ASSESSMENT_COUNT risk assessments"
else
    echo "   ℹ️  No assessments yet (run: POST /api/suppliers/1/assess)"
fi
echo ""

echo "5️⃣ Frontend Check:"
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "   ✅ Frontend running on http://localhost:5173"
else
    echo "   ❌ Frontend not running (run: cd aegis-frontend && npm run dev)"
fi
echo ""

echo "================================"
echo "📊 Summary:"
echo "================================"

# Count successes
SUCCESSES=0
if curl -s http://localhost:8000/health > /dev/null 2>&1; then ((SUCCESSES++)); fi
if [ -n "$SUPPLIER_COUNT" ] && [ "$SUPPLIER_COUNT" -gt 0 ]; then ((SUCCESSES++)); fi
if curl -s http://localhost:8000/api/ml-models/versions/active > /dev/null 2>&1; then ((SUCCESSES++)); fi
if curl -s http://localhost:5173 > /dev/null 2>&1; then ((SUCCESSES++)); fi

echo "✅ $SUCCESSES/4 checks passed"
echo ""

if [ $SUCCESSES -eq 4 ]; then
    echo "🎉 All systems operational!"
    echo ""
    echo "Try these:"
    echo "  • Open frontend: http://localhost:5173"
    echo "  • View API docs: http://localhost:8000/docs"
    echo "  • Train ML model: ./train_ml_model.sh"
else
    echo "⚠️  Some issues detected. See TESTING_GUIDE.md for troubleshooting."
fi
