#!/bin/bash

# Hubstaff Clone Quick Start Script

echo "🚀 Starting Hubstaff Clone..."

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "❌ Port $1 is already in use"
        return 1
    else
        echo "✅ Port $1 is available"
        return 0
    fi
}

# Check ports
check_port 8001 || exit 1
check_port 3000 || exit 1

# Start backend
echo "🔧 Starting backend server..."
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait for backend to start
sleep 5

# Start frontend
echo "🎨 Starting frontend server..."
cd ../frontend
if command -v yarn &> /dev/null; then
    yarn start &
else
    npm start &
fi
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

echo ""
echo "🎉 Hubstaff Clone is starting up!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8001"
echo "📚 API Docs: http://localhost:8001/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'echo ""; echo "🛑 Stopping services..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT
wait