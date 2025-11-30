"""
Database models and initialization.
"""

from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, DECIMAL
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timezone
from app.config import settings

# Create engine
DATABASE_URL = f"sqlite:///{settings.LOCAL_DB_PATH}"
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Needed for SQLite
    echo=settings.DEBUG
)

# Session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class
Base = declarative_base()


class Calculation(Base):
    """Calculation history table."""
    __tablename__ = "calculations"
    
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(String, nullable=False)  # Store as string to preserve precision
    currency = Column(String(3), nullable=False)
    
    # Source/target for FX
    source_currency = Column(String(3), nullable=True)
    target_currency = Column(String(3), nullable=True)
    exchange_rate = Column(String, nullable=True)
    
    # Optimization
    optimization_mode = Column(String(50), default="greedy")
    constraints = Column(Text, nullable=True)  # JSON string
    
    # Result
    result = Column(Text, nullable=False)  # JSON string
    total_notes = Column(String, default="0")  # Store as string for large numbers
    total_coins = Column(String, default="0")  # Store as string for large numbers
    total_denominations = Column(String, default="0")  # Store as string for large numbers
    
    # Metadata
    source = Column(String(20), default="desktop")  # desktop/mobile/api
    synced = Column(Boolean, default=False)
    cloud_id = Column(String, nullable=True)  # ID in cloud database
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class UserSetting(Base):
    """User settings table."""
    __tablename__ = "user_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class ExportRecord(Base):
    """Export history table."""
    __tablename__ = "export_records"
    
    id = Column(Integer, primary_key=True, index=True)
    export_type = Column(String(20), nullable=False)  # csv, excel, pdf
    file_path = Column(String, nullable=False)
    item_count = Column(Integer, default=0)
    file_size_bytes = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


async def init_db():
    """Initialize database - create tables."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
