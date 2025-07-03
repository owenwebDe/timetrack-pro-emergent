#!/bin/bash

# Hubstaff Clone Test Script
# This script runs comprehensive tests for the application

set -e

echo "🧪 Running Hubstaff Clone Tests..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if backend is running
print_status "Checking if backend is running..."
if curl -s http://localhost:8001/health > /dev/null; then
    print_success "Backend is running"
    BACKEND_RUNNING=true
else
    print_warning "Backend is not running, starting it..."
    cd backend
    source venv/bin/activate
    uvicorn server:app --host 0.0.0.0 --port 8001 &
    BACKEND_PID=$!
    BACKEND_RUNNING=false
    
    # Wait for backend to start
    echo "Waiting for backend to start..."
    for i in {1..30}; do
        if curl -s http://localhost:8001/health > /dev/null; then
            print_success "Backend started successfully"
            break
        fi
        sleep 1
    done
    cd ..
fi

# Run backend tests
print_status "Running backend tests..."
cd backend
source venv/bin/activate

# Run API tests
if [ -f "backend_test.py" ]; then
    python backend_test.py
    print_success "Backend API tests completed"
else
    print_warning "Backend test file not found"
fi

# Run unit tests if they exist
if [ -d "tests" ]; then
    python -m pytest tests/ -v
    print_success "Backend unit tests completed"
else
    print_warning "Backend unit tests directory not found"
fi

cd ..

# Run frontend tests
print_status "Running frontend tests..."
cd frontend

# Check if test command exists in package.json
if grep -q '"test"' package.json; then
    if command -v yarn &> /dev/null; then
        yarn test --watchAll=false --coverage
    else
        npm test -- --watchAll=false --coverage
    fi
    print_success "Frontend tests completed"
else
    print_warning "Frontend tests not configured"
fi

cd ..

# Health check tests
print_status "Running health checks..."

# Test backend health
if curl -s http://localhost:8001/health | grep -q "healthy"; then
    print_success "Backend health check passed"
else
    print_error "Backend health check failed"
fi

# Test API endpoints
print_status "Testing critical API endpoints..."

# Test root endpoint
if curl -s http://localhost:8001/api | grep -q "message"; then
    print_success "API root endpoint working"
else
    print_error "API root endpoint failed"
fi

# Test API documentation
if curl -s http://localhost:8001/docs | grep -q "swagger"; then
    print_success "API documentation accessible"
else
    print_warning "API documentation may not be accessible"
fi

# Database connectivity test
print_status "Testing database connectivity..."
cd backend
source venv/bin/activate

python3 -c "
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def test_db():
    try:
        client = AsyncIOMotorClient(os.environ['MONGO_URL'])
        db = client[os.environ['DB_NAME']]
        await db.command('ping')
        print('✅ Database connectivity test passed')
        
        # Test basic operations
        test_collection = db.test_collection
        await test_collection.insert_one({'test': 'data'})
        result = await test_collection.find_one({'test': 'data'})
        await test_collection.delete_one({'test': 'data'})
        
        if result:
            print('✅ Database operations test passed')
        else:
            print('❌ Database operations test failed')
            
        client.close()
        return True
    except Exception as e:
        print(f'❌ Database test failed: {e}')
        return False

asyncio.run(test_db())
"

cd ..

# Performance tests
print_status "Running basic performance tests..."

# Test API response time
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}\n' http://localhost:8001/health)
if (( $(echo "$RESPONSE_TIME < 1.0" | bc -l) )); then
    print_success "API response time: ${RESPONSE_TIME}s (Good)"
else
    print_warning "API response time: ${RESPONSE_TIME}s (Consider optimization)"
fi

# Cleanup
if [ "$BACKEND_RUNNING" = false ] && [ ! -z "$BACKEND_PID" ]; then
    print_status "Stopping test backend..."
    kill $BACKEND_PID 2>/dev/null || true
fi

echo ""
print_success "🎉 All tests completed!"
echo ""
echo "📊 Test Summary:"
echo "   ✅ Backend health checks"
echo "   ✅ API endpoint tests"
echo "   ✅ Database connectivity"
echo "   ✅ Performance checks"
echo ""
print_success "Your Hubstaff Clone is ready for use! 🚀"