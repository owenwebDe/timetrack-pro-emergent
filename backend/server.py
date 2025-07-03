from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager

# Import database connection
from .database.mongodb import connect_to_mongo, close_mongo_connection

# Import routes
from .routes import auth, users, projects, time_tracking, analytics, integrations, websocket

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    await connect_to_mongo()
    logger.info("Hubstaff Clone API started successfully")
    yield
    # Shutdown
    await close_mongo_connection()
    logger.info("Hubstaff Clone API shutdown complete")

# Create the main app
app = FastAPI(
    title="Hubstaff Clone API",
    description="A comprehensive time tracking and productivity monitoring API",
    version="1.0.0",
    lifespan=lifespan
)

# Create API router with /api prefix
api_router = APIRouter(prefix="/api")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all route modules
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(projects.router)
api_router.include_router(time_tracking.router)
api_router.include_router(analytics.router)
api_router.include_router(integrations.router)

# Include WebSocket routes (without /api prefix)
app.include_router(websocket.router)

# Include the API router in the main app
app.include_router(api_router)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Hubstaff Clone API",
        "version": "1.0.0"
    }

# Root endpoint
@api_router.get("/")
async def root():
    return {
        "message": "Welcome to Hubstaff Clone API",
        "version": "1.0.0",
        "documentation": "/docs"
    }
