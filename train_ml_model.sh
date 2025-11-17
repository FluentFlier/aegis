#!/bin/bash
# ML Model Training Script for Aegis

echo "🤖 Training ML Model..."
echo ""

# Train the model
echo "Step 1: Training gradient boosting model..."
RESPONSE=$(curl -s -X POST http://localhost:8000/api/ml-models/train \
  -H "Content-Type: application/json" \
  -d '{
    "model_type": "gradient_boosting",
    "test_size": 0.2,
    "random_state": 42
  }')

echo "$RESPONSE" | python -m json.tool

# Extract version ID (requires jq, or manual check)
VERSION_ID=$(echo "$RESPONSE" | python -c "import sys, json; print(json.load(sys.stdin).get('id', 'N/A'))" 2>/dev/null || echo "Check response for version ID")

echo ""
echo "✅ Training complete!"
echo ""
echo "New risk matrix version: $VERSION_ID"
echo ""
echo "To approve these new weights, run:"
echo "  curl -X POST http://localhost:8000/api/ml-models/versions/$VERSION_ID/approve"
echo ""
echo "Or view all versions:"
echo "  curl http://localhost:8000/api/ml-models/versions"
