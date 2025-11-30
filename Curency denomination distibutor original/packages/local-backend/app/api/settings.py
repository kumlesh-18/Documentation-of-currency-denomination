"""
Settings API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any
import json

from app.database import get_db, UserSetting


router = APIRouter()


class SettingUpdate(BaseModel):
    """Setting update request."""
    key: str
    value: Any


@router.get("/settings")
async def get_all_settings(db: Session = Depends(get_db)):
    """Get all user settings."""
    try:
        settings = db.query(UserSetting).all()
        
        result = {}
        for setting in settings:
            try:
                # Try to parse as JSON
                result[setting.key] = json.loads(setting.value)
            except json.JSONDecodeError:
                # Store as string if not JSON
                result[setting.key] = setting.value
        
        return {
            "settings": result,
            "count": len(result)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/settings/{key}")
async def get_setting(key: str, db: Session = Depends(get_db)):
    """Get a specific setting."""
    try:
        setting = db.query(UserSetting).filter(UserSetting.key == key).first()
        
        if not setting:
            return {"key": key, "value": None, "exists": False}
        
        try:
            value = json.loads(setting.value)
        except json.JSONDecodeError:
            value = setting.value
        
        return {
            "key": key,
            "value": value,
            "exists": True,
            "updated_at": setting.updated_at
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/settings")
async def update_setting(
    setting: SettingUpdate,
    db: Session = Depends(get_db)
):
    """Update or create a setting."""
    try:
        # Convert value to JSON string for proper type preservation
        value_str = json.dumps(setting.value)
        
        # Check if exists
        existing = db.query(UserSetting).filter(UserSetting.key == setting.key).first()
        
        if existing:
            existing.value = value_str
            message = "Setting updated"
        else:
            new_setting = UserSetting(key=setting.key, value=value_str)
            db.add(new_setting)
            message = "Setting created"
        
        db.commit()
        
        return {
            "message": message,
            "key": setting.key,
            "value": setting.value
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/settings/{key}")
async def delete_setting(key: str, db: Session = Depends(get_db)):
    """Delete a setting."""
    try:
        setting = db.query(UserSetting).filter(UserSetting.key == key).first()
        
        if not setting:
            raise HTTPException(status_code=404, detail="Setting not found")
        
        db.delete(setting)
        db.commit()
        
        return {"message": "Setting deleted", "key": key}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# Predefined setting keys with defaults
DEFAULT_SETTINGS = {
    "theme": "light",
    "default_currency": "INR",
    "default_optimization_mode": "greedy",
    "quick_access_count": 10,
    "quick_access_enabled": True,
    "auto_save_history": True,
    "sync_enabled": True,
    "language": "en"
}


@router.post("/settings/reset")
async def reset_to_defaults(db: Session = Depends(get_db)):
    """Reset all settings to defaults."""
    try:
        # Delete all existing settings
        db.query(UserSetting).delete()
        
        # Create default settings
        for key, value in DEFAULT_SETTINGS.items():
            value_str = json.dumps(value) if isinstance(value, (dict, list, bool)) else str(value)
            setting = UserSetting(key=key, value=value_str)
            db.add(setting)
        
        db.commit()
        
        return {
            "message": "Settings reset to defaults",
            "settings": DEFAULT_SETTINGS
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
