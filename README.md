# 🚀 Hubstaff Clone - Complete Time Tracking & Productivity Platform

A comprehensive full-stack web application that replicates all core features of Hubstaff, including time tracking, team management, project management, real-time analytics, and third-party integrations.

![Hubstaff Clone](https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1200&h=400&fit=crop)

## ✨ Features

### 🔐 **Authentication & Authorization**
- JWT-based authentication with refresh tokens
- Role-based access control (Admin, Manager, User)
- Secure password hashing with bcrypt
- Protected routes and API endpoints

### ⏰ **Time Tracking**
- Real-time timer with start/stop functionality
- Manual time entry for offline work
- Project and task assignment
- Activity monitoring (mouse/keyboard tracking)
- Automatic screenshot capture
- Idle time detection

### 👥 **Team Management**
- User invitation system
- Team member roles and permissions
- Real-time online/offline status
- Activity monitoring and oversight
- Performance metrics and analytics

### 📁 **Project Management**
- Hierarchical project structure
- Task creation and assignment
- Budget tracking and monitoring
- Progress visualization
- Deadline management
- Team collaboration tools

### 📊 **Advanced Analytics**
- Interactive dashboard with Chart.js
- Real-time productivity metrics
- Team performance analytics
- Custom report generation
- Data export capabilities
- Activity heatmaps

### 🔗 **Third-Party Integrations**
- **Slack**: Notifications and alerts
- **Trello**: Card creation and sync
- **GitHub**: Issue tracking integration
- **Webhooks**: Custom integrations

### ⚡ **Real-Time Features**
- WebSocket-based live updates
- Real-time notifications
- Live user status tracking
- Team activity feeds
- Instant data synchronization

## 🛠️ Tech Stack

### **Backend**
- **FastAPI** - High-performance Python web framework
- **MongoDB** - NoSQL database with Motor async driver
- **JWT** - Secure authentication tokens
- **WebSocket** - Real-time communication
- **Pydantic** - Data validation and serialization
- **Bcrypt** - Password hashing

### **Frontend**
- **React 19** - Modern React with hooks
- **Chart.js** - Data visualization
- **Socket.IO** - Real-time WebSocket client
- **Axios** - HTTP client with interceptors
- **TailwindCSS** - Utility-first CSS framework
- **Date-fns** - Date manipulation

### **Database**
- **MongoDB** - Primary database
- **Motor** - Async MongoDB driver
- **Aggregation Pipelines** - Complex analytics queries

## 📋 Prerequisites

Before starting, ensure you have the following installed:

- **Python 3.8+** with pip
- **Node.js 16+** with npm/yarn
- **MongoDB 4.4+** (local installation or MongoDB Atlas)
- **Git** for cloning the repository

### System Requirements
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: At least 2GB free space
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)

## 🚀 Quick Start Guide

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/hubstaff-clone.git
cd hubstaff-clone
```

### 2. Environment Setup

#### Backend Environment Variables

Create the backend environment file:

```bash
cd backend
cp .env.example .env
```

Edit `/backend/.env` with your configuration:

```env
# Database Configuration
MONGO_URL="mongodb://localhost:27017"
DB_NAME="hubstaff_clone"

# Security Configuration
SECRET_KEY="your-super-secret-key-change-in-production-hubstaff-clone-2025"

# Optional: MongoDB Atlas (if using cloud database)
# MONGO_URL="mongodb+srv://username:password@cluster.mongodb.net/"

# Optional: Redis (for caching - if implemented)
# REDIS_URL="redis://localhost:6379"

# Environment
ENVIRONMENT="development"
```

#### Frontend Environment Variables

Create the frontend environment file:

```bash
cd ../frontend
cp .env.example .env
```

Edit `/frontend/.env` with your configuration:

```env
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:8001

# Optional: Analytics & Monitoring
# REACT_APP_GOOGLE_ANALYTICS=""
# REACT_APP_SENTRY_DSN=""

# Optional: Third-party API Keys (for integrations)
# REACT_APP_SLACK_CLIENT_ID=""
# REACT_APP_GITHUB_CLIENT_ID=""
```

### 3. Database Setup

#### Option A: Local MongoDB Installation

**Windows:**
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Install and start MongoDB service
3. Default connection: `mongodb://localhost:27017`

**macOS:**
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

**Linux (Ubuntu):**
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list

# Update and install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Option B: MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster (free tier available)
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/`
4. Update `MONGO_URL` in `/backend/.env`

### 4. Backend Setup

#### Install Python Dependencies

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Initialize Database

The application will automatically create indexes and collections on first run, but you can manually initialize:

```bash
# Optional: Run database initialization script
python -c "
import asyncio
from database.mongodb import connect_to_mongo, create_indexes
asyncio.run(connect_to_mongo())
"
```

### 5. Frontend Setup

#### Install Node.js Dependencies

```bash
cd ../frontend

# Install dependencies (using yarn - recommended)
yarn install

# Or using npm
npm install
```

### 6. Start the Application

#### Method 1: Using Supervisor (Production-like)

If you have supervisor installed (recommended for development):

```bash
# From project root
sudo supervisorctl start all

# Check status
sudo supervisorctl status

# View logs
sudo supervisorctl tail -f frontend
sudo supervisorctl tail -f backend
```

#### Method 2: Manual Start (Development)

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # if using virtual environment
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
yarn start
# Or: npm start
```

### 7. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs
- **Health Check**: http://localhost:8001/health

## 📚 API Documentation

The application includes comprehensive API documentation:

- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc
- **OpenAPI Schema**: http://localhost:8001/openapi.json

### Key API Endpoints

```bash
# Authentication
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
POST /api/auth/logout      # User logout
GET  /api/auth/me          # Current user info

# Time Tracking
POST /api/time-tracking/start     # Start time tracking
POST /api/time-tracking/stop/{id} # Stop time tracking
GET  /api/time-tracking/active    # Get active time entry
GET  /api/time-tracking/entries   # Get time entries

# Projects
GET  /api/projects         # Get projects
POST /api/projects         # Create project
GET  /api/projects/{id}    # Get project details
PUT  /api/projects/{id}    # Update project

# Analytics
GET  /api/analytics/dashboard     # Dashboard analytics
GET  /api/analytics/team         # Team analytics
GET  /api/analytics/productivity # Productivity analytics

# Integrations
GET  /api/integrations           # Get integrations
POST /api/integrations/slack/connect    # Connect Slack
POST /api/integrations/trello/connect   # Connect Trello
POST /api/integrations/github/connect   # Connect GitHub
```

## 🔧 Configuration

### Environment Variables Reference

#### Backend (.env)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGO_URL` | MongoDB connection string | `mongodb://localhost:27017` | Yes |
| `DB_NAME` | Database name | `hubstaff_clone` | Yes |
| `SECRET_KEY` | JWT secret key | - | Yes |
| `ENVIRONMENT` | Environment mode | `development` | No |

#### Frontend (.env)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REACT_APP_BACKEND_URL` | Backend API URL | `http://localhost:8001` | Yes |

### Database Configuration

The application uses MongoDB with the following collections:
- `users` - User accounts and profiles
- `projects` - Project information
- `tasks` - Task details and assignments
- `time_entries` - Time tracking records
- `activity_data` - Activity monitoring data
- `screenshots` - Screenshot metadata
- `integrations` - Third-party integration settings

## 🔐 Security Configuration

### JWT Configuration

Update the `SECRET_KEY` in your backend `.env` file:

```env
# Generate a secure random key
SECRET_KEY="$(openssl rand -hex 32)"
```

### CORS Configuration

For production, update CORS settings in `/backend/server.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["https://yourdomain.com"],  # Update for production
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

## 🧪 Testing

### Backend Testing

```bash
cd backend

# Run all tests
python -m pytest

# Run specific test file
python -m pytest tests/test_auth.py

# Run with coverage
python -m pytest --cov=. --cov-report=html
```

### Frontend Testing

```bash
cd frontend

# Run tests
yarn test
# Or: npm test

# Run tests with coverage
yarn test --coverage
```

### Manual API Testing

Use the provided test script:

```bash
cd backend
python backend_test.py
```

## 🚀 Deployment

### Production Environment Variables

#### Backend Production (.env)

```env
MONGO_URL="mongodb+srv://username:password@cluster.mongodb.net/"
DB_NAME="hubstaff_clone_prod"
SECRET_KEY="your-production-secret-key-minimum-32-characters"
ENVIRONMENT="production"
```

#### Frontend Production (.env)

```env
REACT_APP_BACKEND_URL=https://api.yourdomain.com
```

### Docker Deployment (Optional)

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8001:8001"
    environment:
      - MONGO_URL=mongodb://mongo:27017
      - DB_NAME=hubstaff_clone
    depends_on:
      - mongo

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_BACKEND_URL=http://localhost:8001

  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

Run with Docker:

```bash
docker-compose up -d
```

## 🔧 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Issues

**Error**: `pymongo.errors.ServerSelectionTimeoutError`

**Solutions**:
- Ensure MongoDB is running: `sudo systemctl status mongod`
- Check connection string in `.env`
- For MongoDB Atlas, ensure IP whitelist includes your IP
- Check firewall settings

#### 2. Port Already in Use

**Error**: `Address already in use`

**Solutions**:
```bash
# Find and kill process using port 8001
lsof -ti:8001 | xargs kill -9

# Or use different port
uvicorn server:app --port 8002
```

#### 3. Module Import Errors

**Error**: `ModuleNotFoundError`

**Solutions**:
```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt

# For frontend
cd frontend && yarn install
```

#### 4. Environment Variables Not Loading

**Solutions**:
- Ensure `.env` files exist in correct directories
- Check file permissions: `chmod 644 .env`
- Restart application after env changes
- Use absolute paths if needed

#### 5. WebSocket Connection Issues

**Solutions**:
- Check if backend is running on correct port
- Verify CORS settings
- Check browser console for errors
- Ensure JWT token is valid

### Performance Optimization

#### Database Optimization

```bash
# Create additional indexes for better performance
mongo hubstaff_clone --eval "
db.time_entries.createIndex({user_id: 1, start_time: -1});
db.projects.createIndex({team_members: 1});
db.activity_data.createIndex({timestamp: -1});
"
```

#### Frontend Optimization

```bash
# Build optimized production bundle
cd frontend
yarn build

# Analyze bundle size
npx webpack-bundle-analyzer build/static/js/*.js
```

## 📞 Support

### Getting Help

1. **Documentation**: Check API docs at `/docs`
2. **Issues**: Create GitHub issue with error details
3. **Logs**: Check application logs for error details

### Log Locations

- **Backend logs**: `sudo supervisorctl tail backend`
- **Frontend logs**: Browser console
- **Database logs**: `/var/log/mongodb/mongod.log`

### Debug Mode

Enable debug mode for detailed error information:

```bash
# Backend debug mode
cd backend
export DEBUG=1
uvicorn server:app --reload --log-level debug

# Frontend debug mode
cd frontend
REACT_APP_DEBUG=true yarn start
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push branch: `git push origin feature/amazing-feature`
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎉 Credits

- **Original Design**: Inspired by [Hubstaff](https://hubstaff.com)
- **Icons**: Emoji icons for universal compatibility
- **Images**: [Unsplash](https://unsplash.com) for high-quality photos
- **Charts**: [Chart.js](https://www.chartjs.org) for data visualization

---

## 🚀 Quick Commands Reference

```bash
# Start everything
sudo supervisorctl start all

# Check status
sudo supervisorctl status

# View logs
sudo supervisorctl tail -f frontend
sudo supervisorctl tail -f backend

# Restart services
sudo supervisorctl restart all

# Stop everything
sudo supervisorctl stop all

# Manual start (development)
cd backend && uvicorn server:app --reload
cd frontend && yarn start
```

**Happy coding! 🎯**
