"""
Translations API endpoints.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import json
import os

router = APIRouter()

# Get the directory where locales are stored
LOCALES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "locales")

# Supported languages
SUPPORTED_LANGUAGES = {
    "en": "English",
    "hi": "हिन्दी (Hindi)",
    "es": "Español (Spanish)",
    "fr": "Français (French)",
    "de": "Deutsch (German)"
}

def load_translation(language_code: str) -> Dict[str, Any]:
    """Load translation file for a specific language."""
    file_path = os.path.join(LOCALES_DIR, f"{language_code}.json")
    
    if not os.path.exists(file_path):
        # Fallback to English if language file doesn't exist
        file_path = os.path.join(LOCALES_DIR, "en.json")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load translation file: {str(e)}"
        )


@router.get("/translations/languages")
async def get_supported_languages():
    """Get list of supported languages."""
    return {
        "languages": [
            {"code": code, "name": name}
            for code, name in SUPPORTED_LANGUAGES.items()
        ],
        "default": "en"
    }


@router.get("/translations/{language_code}")
async def get_translations(language_code: str):
    """Get translations for a specific language."""
    if language_code not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language: {language_code}. Supported: {list(SUPPORTED_LANGUAGES.keys())}"
        )
    
    try:
        translations = load_translation(language_code)
        return {
            "language": language_code,
            "language_name": SUPPORTED_LANGUAGES[language_code],
            "translations": translations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/translations")
async def get_all_translations():
    """Get all available translations (for debugging/admin purposes)."""
    try:
        all_translations = {}
        for lang_code in SUPPORTED_LANGUAGES.keys():
            all_translations[lang_code] = load_translation(lang_code)
        
        return {
            "languages": SUPPORTED_LANGUAGES,
            "translations": all_translations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
