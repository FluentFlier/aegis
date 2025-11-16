#!/bin/bash

# Aegis - Stop All Services Script

echo "=========================================="
echo "   🛑 Stopping Aegis Platform"
echo "=========================================="
echo ""

# Kill backend
echo "Stopping Backend..."
pkill -f "uvicorn src.main:app" && echo "✓ Backend stopped" || echo "  (Backend was not running)"

# Kill frontend
echo "Stopping Frontend..."
pkill -f "vite" && echo "✓ Frontend stopped" || echo "  (Frontend was not running)"

echo ""
echo "=========================================="
echo "   ✅ All services stopped"
echo "=========================================="
