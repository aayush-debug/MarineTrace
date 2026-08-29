#!/bin/bash
set -e

echo "🌊 ==================================================================="
echo "🛰️  MARINETRACE — DOCKER FULL-STACK CONTAINER LAUNCHER"
echo "🌊 ==================================================================="

# Check if docker daemon is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Error: Docker daemon is not running. Please open Docker Desktop and try again."
    exit 1
fi

echo "🔹 Building and starting MarineTrace containers..."
docker compose up --build -d

echo ""
echo "⏳ Waiting for backend and frontend services to be ready..."
sleep 5

# Check status
docker compose ps

echo ""
echo "✅ ==================================================================="
echo "🎉 MARINETRACE PLATFORM IS RUNNING IN DOCKER!"
echo "🌊 ==================================================================="
echo "🔹 React Frontend:    http://localhost:5173"
echo "🔹 FastAPI Backend:   http://localhost:8000"
echo "🔹 Swagger API Docs:  http://localhost:8000/docs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 Commands:"
echo "   • View live logs:     docker compose logs -f"
echo "   • Stop platform:      docker compose down"
echo "   • Run tests:          docker compose exec backend pytest tests/"
echo "   • Run CLI demo:       docker compose exec backend python /app/scripts/run_demo.py"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
