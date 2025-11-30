"""
Local Backend API - FastAPI Application

This is the offline backend that runs on the user's machine.
Provides REST API for the desktop Electron application.

Features:
- Local SQLite database
- Full denomination calculation
- History management
- Bulk processing
- Export functionality
- Optional cloud sync when online
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import sys
from pathlib import Path

# Add core-engine to path
core_engine_path = Path(__file__).parent.parent / "core-engine"
sys.path.insert(0, str(core_engine_path))

from app.api import calculations, history, export, settings, translations
from app.database import engine, init_db
from app.config import settings as app_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    print("🚀 Starting Local Backend API...")
    print(f"📁 Database: {app_settings.LOCAL_DB_PATH}")
    await init_db()
    print("✓ Database initialized")
    
    yield
    
    # Shutdown
    print("👋 Shutting down Local Backend API...")


# Create FastAPI app
app = FastAPI(
    title="Currency Denomination System - Local API",
    description="Offline-first backend for desktop application",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware (allow Electron app to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify Electron app origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Root endpoint
@app.get("/")
async def root():
    """API root - health check."""
    return {
        "service": "Currency Denomination System - Local API",
        "version": "1.0.0",
        "mode": "offline",
        "status": "operational",
        "database": str(app_settings.LOCAL_DB_PATH),
        "sync_enabled": app_settings.SYNC_ENABLED,
        "endpoints": {
            "calculations": "/api/v1/calculate",
            "bulk": "/api/v1/bulk-calculate",
            "history": "/api/v1/history",
            "export": "/api/v1/export",
            "settings": "/api/v1/settings",
            "translations": "/api/v1/translations",
            "docs": "/docs"
        }
    }


# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "database": "connected"
    }


# Include routers
app.include_router(
    calculations.router,
    prefix="/api/v1",
    tags=["calculations"]
)

app.include_router(
    history.router,
    prefix="/api/v1",
    tags=["history"]
)

app.include_router(
    export.router,
    prefix="/api/v1",
    tags=["export"]
)

app.include_router(
    settings.router,
    prefix="/api/v1",
    tags=["settings"]
)

app.include_router(
    translations.router,
    prefix="/api/v1",
    tags=["translations"]
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Handle unexpected errors gracefully."""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if app_settings.DEBUG else "An error occurred"
        }
    )


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8001,
        reload=True,
        log_level="info"
    )
