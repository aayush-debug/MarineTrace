#!/bin/bash
# MarineTrace All-in-One Startup Script

# Clean up any lingering background processes on ports 8000 & 5173
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

echo "🌊 ==================================================================="
echo "🛰️  STARTING MARINETRACE PLATFORM"
echo "🌊 ==================================================================="
echo "🔹 FastAPI Backend:   http://localhost:8000 (Docs: http://localhost:8000/docs)"
echo "🔹 React Frontend:    http://localhost:5173"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Start backend in background
(cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000) &
BACKEND_PID=$!

# Start frontend
npm --prefix frontend run dev &
FRONTEND_PID=$!

# Trap Ctrl+C to terminate both servers cleanly
trap "echo -e '\n🛑 Shutting down MarineTrace services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

wait
