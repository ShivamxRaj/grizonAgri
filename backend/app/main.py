"""
Grizon Agri — FastAPI Application Entry Point
Voice-first agricultural AI for Punjab & Haryana farmers.
"""
import sys
import io
import structlog

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from contextlib import asynccontextmanager
from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.database import init_db
from app.api.routes_chat import router as chat_router
from app.api.routes_voice import router as voice_router
from app.api.routes_mandi import router as mandi_router
from app.api.routes_disease import router as disease_router
from app.api.routes_weather import router as weather_router
from app.api.routes_planner import router as planner_router
from app.api.routes_finance import router as finance_router
from app.api.routes_auth import router as auth_router

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    logger.info("grizon_agri_starting", env=settings.APP_ENV)
    await init_db()
    yield
    logger.info("grizon_agri_shutting_down")


app = FastAPI(
    title="Grizon Agri API",
    description="Voice-first agricultural AI for Indian farmers. Talk to your farm.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — Allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(chat_router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(voice_router, prefix="/api/v1/voice", tags=["Voice"])
app.include_router(mandi_router, prefix="/api/v1/mandi", tags=["Mandi"])
app.include_router(disease_router, prefix="/api/v1/disease", tags=["Disease"])
app.include_router(weather_router, prefix="/api/v1/weather", tags=["Weather"])
app.include_router(planner_router, prefix="/api/v1/planner", tags=["Planner"])
app.include_router(finance_router, prefix="/api/v1/finance", tags=["Finance"])


@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "service": "grizon-agri",
        "version": "0.1.0",
        "environment": settings.APP_ENV,
    }


@app.get("/", tags=["System"])
async def root():
    """Root endpoint — API information."""
    return {
        "message": "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! Grizon Agri API is running.",
        "docs": "/docs",
        "health": "/health",
    }
