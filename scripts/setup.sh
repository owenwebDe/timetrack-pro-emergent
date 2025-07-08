#!/bin/bash

# Hubstaff Clone Setup Script
# This script automates the initial setup process

set -e

echo "🚀 Setting up Hubstaff Clone..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check prerequisites
print_status "Checking prerequisites..."

# Check Python
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
print_success "Python $PYTHON_VERSION found"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

NODE_VERSION=$(node --version)
print_success "Node.js $NODE_VERSION found"

# Check MongoDB
if ! command -v mongod &> /dev/null; then
    print_warning "MongoDB not found locally. Make sure you have MongoDB Atlas or install MongoDB locally."
fi

# Check if .env files exist
print_status "Setting up environment files..."

# Backend .env
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        print_success "Created backend/.env from example"
        print_warning "Please edit backend/.env with your configuration"
    else
        print_error "backend/.env.example not found"
        exit 1
    fi
else
    print_success "backend/.env already exists"
fi

# Frontend .env
if [ ! -f "frontend/.env" ]; then
    if [ -f "frontend/.env.example" ]; then
        cp frontend/.env.example frontend/.env
        print_success "Created frontend/.env from example"
    else
        print_error "frontend/.env.example not found"
        exit 1
    fi
else
    print_success "frontend/.env already exists"
fi

# Setup backend
print_status "Setting up backend..."
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
    print_success "Virtual environment created"
fi

# Activate virtual environment and install dependencies
print_status "Installing Python dependencies..."
source venv/bin/activate
pip install -r requirements.txt
print_success "Python dependencies installed"

# Go back to root directory
cd ..

# Setup frontend
print_status "Setting up frontend..."
cd frontend

# Check for yarn
if command -v yarn &> /dev/null; then
    print_status "Installing Node.js dependencies with yarn..."
    yarn install
else
    print_status "Installing Node.js dependencies with npm..."
    npm install
fi

print_success "Node.js dependencies installed"

# Go back to root directory
cd ..

# Generate secret key for production
print_status "Generating secure secret key..."
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/your-super-secret-key-change-in-production-hubstaff-clone-2025/$SECRET_KEY/" backend/.env
else
    # Linux
    sed -i "s/your-super-secret-key-change-in-production-hubstaff-clone-2025/$SECRET_KEY/" backend/.env
fi
print_success "Secret key generated and updated in backend/.env"

# Check MongoDB connection
print_status "Checking MongoDB connection..."
cd backend
source venv/bin/activate

python3 -c "
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from dotenv import load_dotenv

load_dotenv()

async def test_connection():
    try:
        client = AsyncIOMotorClient(os.environ['MONGO_URL'])
        db = client[os.environ['DB_NAME']]
        await db.command('ping')
        print('✅ MongoDB connection successful')
        client.close()
        return True
    except Exception as e:
        print(f'❌ MongoDB connection failed: {e}')
        return False

result = asyncio.run(test_connection())
sys.exit(0 if result else 1)
" && print_success "MongoDB connection verified" || print_warning "MongoDB connection failed - please check your MONGO_URL in backend/.env"

cd ..

# Create startup script
print_status "Creating startup script..."
cat > start.sh << 'EOF'
#!/bin/bash

# Hubstaff Clone Startup Script

echo "🚀 Starting Hubstaff Clone..."

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
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
echo "📱 Frontend: https://icon-time-tracker.vercel.app"
echo "🔧 Backend API: https://icon-time-tracker.onrender.com"
echo "📚 API Docs: https://icon-time-tracker.onrender.com/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'echo ""; echo "🛑 Stopping services..."; kill $BACKEND_PID $FRONTEND_PID; exit' INT
wait
EOF

chmod +x start.sh
print_success "Startup script created: ./start.sh"

# Setup complete
echo ""
print_success "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Edit backend/.env with your MongoDB connection string"
echo "2. Edit frontend/.env if needed"
echo "3. Start the application:"
echo "   - Quick start: ./start.sh"
echo "   - Or manually: cd backend && source venv/bin/activate && uvicorn server:app --reload"
echo "   - In another terminal: cd frontend && yarn start"
echo ""
echo "📱 Access the application at: https://icon-time-tracker.vercel.app"
echo "🔧 API documentation at: https://icon-time-tracker.onrender.com/docs"
echo ""
print_success "Happy coding! 🚀"