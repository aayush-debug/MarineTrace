#!/bin/bash
# MarineTrace All-in-One Startup Script

# If Docker is available and running, default to Docker Compose
if docker info >/dev/null 2>&1; then
    echo "🌊 ==================================================================="
    echo "🛰️  STARTING MARINETRACE PLATFORM (DOCKER ENVIRONMENT)"
    echo "🌊 ==================================================================="
    docker compose up -d
    echo ""
    echo "✅ MarineTrace is running:"
    echo "🔹 React Frontend:    http://localhost:5173"
    echo "🔹 FastAPI Backend:   http://localhost:8000"
    echo "🔹 Swagger API Docs:  http://localhost:8000/docs"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "💡 Run 'docker compose logs -f' to stream live logs, or 'docker compose down' to stop."
    exit 0
fi

# Fallback: Native local process execution
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

echo "🌊 ==================================================================="
echo "🛰️  STARTING MARINETRACE PLATFORM (NATIVE PROCESSES)"
echo "🌊 ==================================================================="
echo "🔹 FastAPI Backend:   http://localhost:8000 (Docs: http://localhost:8000/docs)"
echo "🔹 React Frontend:    http://localhost:5173"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Start backend in background
(cd backend && uvicorn app.main:app --reload --port 8000) &
BACKEND_PID=$!

# Start frontend
npm --prefix frontend run dev &
FRONTEND_PID=$!

# Trap Ctrl+C to terminate both servers cleanly
trap "echo -e '\n🛑 Shutting down MarineTrace services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

wait
