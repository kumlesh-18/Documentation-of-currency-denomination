"""
Configuration settings for local backend.
"""

from pydantic_settings import BaseSettings
from pathlib import Path
from typing import Optional


class Settings(BaseSettings):
    """Application settings."""
    
    # Application
    APP_NAME: str = "Currency Denomination System - Local Backend"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database
    LOCAL_DB_PATH: Path = Path("./data/local.db")
    
    # Cloud sync
    SYNC_ENABLED: bool = True
    CLOUD_API_URL: Optional[str] = "http://localhost:8000"
    SYNC_INTERVAL_MINUTES: int = 30
    
    # Export
    EXPORT_DIR: Path = Path("./exports")
    MAX_EXPORT_SIZE_MB: int = 100
    
    # History
    MAX_HISTORY_ITEMS: int = 10000
    QUICK_ACCESS_COUNT: int = 10
    
    # Bulk processing
    MAX_BULK_ROWS: int = 100000
    BULK_BATCH_SIZE: int = 1000
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# Ensure directories exist
settings.LOCAL_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
settings.EXPORT_DIR.mkdir(parents=True, exist_ok=True)
