"""
Calculations API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from decimal import Decimal, InvalidOperation
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import json
import sys
from pathlib import Path
import csv
import io
from collections import Counter
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Import OCR processor
from app.services.ocr_processor import get_ocr_processor

# Add core-engine to path
core_engine_path = Path(__file__).parent.parent.parent.parent / "core-engine"
sys.path.insert(0, str(core_engine_path))

from engine import DenominationEngine
from models import CalculationRequest as CoreRequest, OptimizationMode
from optimizer import OptimizationEngine
from fx_service import FXService

from app.database import get_db, Calculation


router = APIRouter()

# Initialize engines
denomination_engine = DenominationEngine()
optimization_engine = OptimizationEngine(denomination_engine)
fx_service = FXService()


# Pydantic models
class CalculateRequest(BaseModel):
    """Request model for calculation."""
    amount: str | float = Field(..., description="Amount to break down (supports large numbers as string)")
    currency: str = Field(..., min_length=3, max_length=3, description="Currency code (e.g., INR, USD)")
    optimization_mode: str = Field(default="greedy", description="Optimization mode")
    source_currency: Optional[str] = Field(None, description="Source currency for FX conversion")
    convert_before_breakdown: bool = Field(True, description="Convert before or after breakdown")
    save_to_history: bool = Field(True, description="Save to history")
    
    class Config:
        json_schema_extra = {
            "example": {
                "amount": 50000,
                "currency": "INR",
                "optimization_mode": "greedy",
                "save_to_history": True
            }
        }


class CalculateResponse(BaseModel):
    """Response model for calculation."""
    id: Optional[int] = None
    amount: str
    currency: str
    breakdowns: List[Dict[str, Any]]
    total_notes: int
    total_coins: int
    total_denominations: int
    optimization_mode: str
    source_currency: Optional[str] = None
    exchange_rate: Optional[str] = None
    explanation: Optional[str] = None
    created_at: Optional[datetime] = None


@router.post("/calculate", response_model=CalculateResponse)
async def calculate(
    request: CalculateRequest,
    db: Session = Depends(get_db)
):
    """
    Calculate denomination breakdown for given amount.
    
    This is the core endpoint used by the desktop app.
    """
    try:
        # Convert to Decimal for precision
        amount_decimal = Decimal(str(request.amount))
        
        # Handle FX conversion if needed
        if request.source_currency and request.source_currency != request.currency:
            converted_amount, rate, rate_timestamp = fx_service.convert_amount(
                amount_decimal,
                request.source_currency,
                request.currency,
                use_live=False  # Offline mode
            )
            amount_to_use = converted_amount
            exchange_rate = rate
        else:
            amount_to_use = amount_decimal
            exchange_rate = None
        
        # Create calculation request
        core_request = CoreRequest(
            amount=amount_to_use,
            currency=request.currency,
            optimization_mode=OptimizationMode(request.optimization_mode),
            source_currency=request.source_currency
        )
        
        # Calculate
        result = denomination_engine.calculate(core_request)
        
        # Save to history if requested
        calculation_id = None
        if request.save_to_history:
            db_calc = Calculation(
                amount=str(result.original_amount),
                currency=result.currency,
                source_currency=request.source_currency,
                exchange_rate=str(exchange_rate) if exchange_rate else None,
                optimization_mode=request.optimization_mode,
                result=json.dumps(result.to_dict()),
                total_notes=str(result.total_notes),
                total_coins=str(result.total_coins),
                total_denominations=str(result.total_denominations),
                source="desktop",
                synced=False
            )
            db.add(db_calc)
            db.commit()
            db.refresh(db_calc)
            calculation_id = db_calc.id
        
        # Format response
        return CalculateResponse(
            id=calculation_id,
            amount=str(result.original_amount),
            currency=result.currency,
            breakdowns=[
                {
                    "denomination": str(b.denomination),
                    "count": b.count,
                    "total_value": str(b.total_value),
                    "is_note": b.is_note
                }
                for b in result.breakdowns
            ],
            total_notes=result.total_notes,
            total_coins=result.total_coins,
            total_denominations=result.total_denominations,
            optimization_mode=request.optimization_mode,
            source_currency=request.source_currency,
            exchange_rate=str(exchange_rate) if exchange_rate else None,
            created_at=datetime.now(timezone.utc)
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation failed: {str(e)}")


@router.get("/currencies")
async def get_currencies():
    """Get list of supported currencies."""
    try:
        currencies = denomination_engine.get_supported_currencies()
        
        details = []
        for code in currencies:
            info = denomination_engine.get_currency_info(code)
            details.append(info)
        
        return {
            "currencies": details,
            "count": len(details)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/currencies/{currency_code}")
async def get_currency_info(currency_code: str):
    """Get detailed information about a specific currency."""
    try:
        info = denomination_engine.get_currency_info(currency_code.upper())
        return info
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/alternatives")
async def get_alternatives(request: CalculateRequest):
    """
    Generate alternative denomination distributions.
    
    Provides 2-3 alternative ways to break down the same amount.
    """
    try:
        amount_decimal = Decimal(str(request.amount))
        
        core_request = CoreRequest(
            amount=amount_decimal,
            currency=request.currency,
            optimization_mode=OptimizationMode(request.optimization_mode)
        )
        
        alternatives = optimization_engine.suggest_alternatives(core_request, count=3)
        
        return {
            "original_amount": str(amount_decimal),
            "currency": request.currency,
            "alternatives": [
                {
                    "breakdowns": [
                        {
                            "denomination": str(b.denomination),
                            "count": b.count,
                            "total_value": str(b.total_value),
                            "is_note": b.is_note
                        }
                        for b in alt.breakdowns
                    ],
                    "total_denominations": alt.total_denominations,
                    "optimization_mode": alt.optimization_mode.value,
                    "explanation": alt.metadata.get('explanation', '')
                }
                for alt in alternatives
            ],
            "count": len(alternatives)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/exchange-rates")
async def get_exchange_rates(base: str = "USD"):
    """Get current exchange rates."""
    try:
        rates = fx_service.get_all_rates(base.upper(), use_live=False)
        cache_age = fx_service.get_cache_age()
        
        return {
            "base_currency": base.upper(),
            "rates": {k: str(v) for k, v in rates.items()},
            "cache_age_hours": cache_age.total_seconds() / 3600 if cache_age else None,
            "is_stale": fx_service.is_cache_stale(),
            "timestamp": datetime.now(timezone.utc)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Bulk CSV Upload Models
class BulkCalculationRow(BaseModel):
    """Single row result from bulk calculation."""
    row_number: int
    status: str  # "success" or "error"
    amount: Optional[str] = None
    currency: Optional[str] = None
    optimization_mode: Optional[str] = None
    total_notes: Optional[int] = None
    total_coins: Optional[int] = None
    total_denominations: Optional[int] = None
    breakdowns: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None
    calculation_id: Optional[int] = None


class BulkUploadResponse(BaseModel):
    """Response model for bulk CSV upload."""
    total_rows: int
    successful: int
    failed: int
    results: List[BulkCalculationRow]
    processing_time_seconds: float
    saved_to_history: bool


@router.post("/bulk-upload", response_model=BulkUploadResponse)
async def bulk_upload_file(
    file: UploadFile = File(..., description="Upload: CSV, PDF, Word (.docx), or Image (JPG/PNG/etc.)"),
    save_to_history: bool = True,
    db: Session = Depends(get_db)
):
    """
    *** REBUILT FROM SCRATCH ***
    Bulk upload file for batch calculations - NO CACHED DATA.
    
    Supported Formats:
    - CSV files (.csv) - Direct parsing
    - PDF files (.pdf) - Text extraction + OCR for scanned PDFs
    - Word documents (.docx) - Text extraction from paragraphs/tables
    - Images (.jpg, .png, .tiff, .bmp) - Tesseract OCR
    
    CSV Format:
    - Required columns: amount, currency
    - Optional: optimization_mode
    - Headers case-insensitive
    
    Other Formats (OCR):
    - Automatic text extraction
    - Parses amounts, currencies, modes
    - Supports: CSV-like, pipe-separated, tabular, natural language
    
    **CRITICAL**: Every upload performs FRESH calculations - no cached results.
    """
    import time
    start_time = time.time()
    
    logger.info(f"========== BULK UPLOAD START ==========")
    logger.info(f"File: {file.filename}")
    
    # Get file extension
    file_ext = Path(file.filename).suffix.lower()
    
    # Supported extensions
    csv_ext = {'.csv'}
    pdf_ext = {'.pdf'}
    word_ext = {'.docx', '.doc'}
    image_ext = {'.jpg', '.jpeg', '.png', '.tiff', '.tif', '.bmp', '.gif', '.webp'}
    all_supported = csv_ext | pdf_ext | word_ext | image_ext
    
    if file_ext not in all_supported:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file: {file_ext}. Supported: CSV, PDF, Word, Images"
        )
    
    try:
        # Read file data
        file_data = await file.read()
        logger.info(f"File size: {len(file_data)} bytes, Type: {file_ext}")
        
        # Route to appropriate processor
        if file_ext in csv_ext:
            logger.info("Processing as CSV (direct parsing)")
            rows_data = parse_csv_file(file_data, file.filename)
        else:
            logger.info(f"Processing with OCR (type: {file_ext})")
            ocr_processor = get_ocr_processor()
            
            # Check dependencies
            deps = ocr_processor.check_dependencies()
            missing = []
            
            if file_ext in pdf_ext:
                if not deps['pymupdf']:
                    missing.append('PyMuPDF')
                if not deps['pdf2image']:
                    missing.append('pdf2image (for scanned PDFs)')
            if file_ext in word_ext and not deps['docx']:
                missing.append('python-docx')
            if file_ext in image_ext and not deps['tesseract']:
                missing.append('Tesseract OCR')
            
            if missing:
                raise HTTPException(
                    status_code=503,
                    detail=f"OCR dependencies missing: {', '.join(missing)}. Run: install_ocr_simple.ps1"
                )
            
            # Process file with OCR
            rows_data = ocr_processor.process_file(file_data, file.filename)
            logger.info(f"Extracted {len(rows_data)} rows from {file_ext}")
        
        if not rows_data:
            raise HTTPException(
                status_code=400,
                detail="No data rows found in file"
            )
        
        logger.info(f"Total rows to process: {len(rows_data)}")
        logger.debug(f"First row sample: {rows_data[0]}")
        
        # Process each row - FRESH CALCULATIONS ONLY
        results = []
        successful_count = 0
        failed_count = 0
        
        for idx, row_data in enumerate(rows_data, start=1):
            row_num = row_data.get('row_number', idx)
            
            logger.debug(f"[ROW {row_num}] Input: {row_data}")
            
            try:
                # Extract and validate fields
                amount_str = row_data.get('amount', '').strip()
                currency_raw = row_data.get('currency', '').strip()
                optimization_raw = row_data.get('optimization_mode', '').strip()
                
                if not amount_str:
                    raise ValueError("Amount is required")
                if not currency_raw:
                    raise ValueError("Currency is required")
                
                # Validate and normalize currency
                currency = currency_raw.upper()
                if len(currency) != 3:
                    raise ValueError(f"Invalid currency code: {currency_raw} (must be 3 letters)")
                
                # Validate and normalize optimization mode
                valid_modes = ['greedy', 'balanced', 'minimize_large', 'minimize_small']
                optimization_mode = optimization_raw.lower() if optimization_raw else 'greedy'
                if optimization_mode not in valid_modes:
                    logger.warning(f"[ROW {row_num}] Invalid mode '{optimization_raw}', using 'greedy'")
                    optimization_mode = 'greedy'
                
                # Parse amount (handle scientific notation)
                try:
                    clean_amount = amount_str.replace(' ', '').replace(',', '')
                    
                    if 'E' in clean_amount.upper() or 'e' in clean_amount:
                        # Scientific notation: convert via float
                        amount_float = float(clean_amount)
                        amount_decimal = Decimal(str(amount_float))
                        logger.debug(f"[ROW {row_num}] Scientific notation: {amount_str} → {amount_decimal}")
                    else:
                        amount_decimal = Decimal(clean_amount)
                    
                    if amount_decimal <= 0:
                        raise ValueError("Amount must be positive")
                        
                except (ValueError, InvalidOperation):
                    raise ValueError(f"Invalid amount: {amount_str}")
                
                # **PERFORM FRESH CALCULATION** - No cached data
                core_request = CoreRequest(
                    amount=amount_decimal,
                    currency=currency,
                    optimization_mode=OptimizationMode(optimization_mode)
                )
                
                logger.debug(f"[ROW {row_num}] Calculating: {amount_decimal} {currency} ({optimization_mode})")
                
                # Calculate denomination breakdown
                calculation_result = denomination_engine.calculate(core_request)
                
                logger.debug(f"[ROW {row_num}] ✓ SUCCESS: {calculation_result.total_denominations} denominations")
                
                # Optionally save to history
                calculation_id = None
                if save_to_history:
                    db_calc = Calculation(
                        amount=str(calculation_result.original_amount),
                        currency=calculation_result.currency,
                        source_currency=None,
                        exchange_rate=None,
                        optimization_mode=optimization_mode,
                        result=json.dumps(calculation_result.to_dict()),
                        total_notes=str(calculation_result.total_notes),
                        total_coins=str(calculation_result.total_coins),
                        total_denominations=str(calculation_result.total_denominations),
                        source="bulk_upload",
                        synced=False
                    )
                    db.add(db_calc)
                    db.commit()
                    db.refresh(db_calc)
                    calculation_id = db_calc.id
                
                # Build success response
                results.append(BulkCalculationRow(
                    row_number=row_num,
                    status="success",
                    amount=str(calculation_result.original_amount),
                    currency=calculation_result.currency,
                    optimization_mode=optimization_mode,
                    total_notes=calculation_result.total_notes,
                    total_coins=calculation_result.total_coins,
                    total_denominations=calculation_result.total_denominations,
                    breakdowns=[
                        {
                            "denomination": str(b.denomination),
                            "count": b.count,
                            "total_value": str(b.total_value),
                            "is_note": b.is_note
                        }
                        for b in calculation_result.breakdowns
                    ],
                    calculation_id=calculation_id
                ))
                successful_count += 1
                
            except ValueError as e:
                logger.warning(f"[ROW {row_num}] ✗ Validation error: {str(e)}")
                results.append(BulkCalculationRow(
                    row_number=row_num,
                    status="error",
                    amount=row_data.get('amount', ''),
                    currency=row_data.get('currency', ''),
                    optimization_mode=row_data.get('optimization_mode', ''),
                    error=str(e)
                ))
                failed_count += 1
                
            except Exception as e:
                logger.error(f"[ROW {row_num}] ✗ Unexpected error: {str(e)}", exc_info=True)
                results.append(BulkCalculationRow(
                    row_number=row_num,
                    status="error",
                    amount=row_data.get('amount', ''),
                    currency=row_data.get('currency', ''),
                    optimization_mode=row_data.get('optimization_mode', ''),
                    error=f"Processing error: {str(e)}"
                ))
                failed_count += 1
        
        processing_time = time.time() - start_time
        
        logger.info(f"========== BULK UPLOAD COMPLETE ==========")
        logger.info(f"Total: {len(results)}, Success: {successful_count}, Failed: {failed_count}, Time: {processing_time:.3f}s")
        
        return BulkUploadResponse(
            total_rows=len(results),
            successful=successful_count,
            failed=failed_count,
            results=results,
            processing_time_seconds=round(processing_time, 3),
            saved_to_history=save_to_history
        )
        
    except HTTPException:
        raise
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="File encoding error. Ensure CSV is UTF-8 encoded"
        )
    except Exception as e:
        logger.error(f"BULK UPLOAD FAILED: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Bulk upload failed: {str(e)}"
        )


def parse_csv_file(csv_data: bytes, filename: str) -> List[Dict[str, Any]]:
    """Parse CSV file into structured rows with case-insensitive headers."""
    csv_text = csv_data.decode('utf-8')
    csv_reader = csv.DictReader(io.StringIO(csv_text))
    
    if not csv_reader.fieldnames:
        raise ValueError("CSV has no headers")
    
    # Case-insensitive header mapping
    header_map = {header.lower(): header for header in csv_reader.fieldnames}
    
    # Check required columns
    required_cols = ['amount', 'currency']
    missing = [col for col in required_cols if col not in header_map]
    if missing:
        raise ValueError(f"Missing columns: {', '.join(missing)}")
    
    rows_data = []
    for row_num, row in enumerate(csv_reader, start=2):
        amount_col = header_map.get('amount', 'amount')
        currency_col = header_map.get('currency', 'currency')
        opt_col = header_map.get('optimization_mode', 'optimization_mode')
        
        rows_data.append({
            'row_number': row_num,
            'amount': row.get(amount_col, '').strip(),
            'currency': row.get(currency_col, '').strip(),
            'optimization_mode': row.get(opt_col, '').strip()
        })
    
    return rows_data


# Smart Currency Recommendation Models
class CurrencyUsageStat(BaseModel):
    """Currency usage statistics."""
    currency: str
    count: int
    last_used: str
    percentage: float


class SmartCurrencyRecommendation(BaseModel):
    """Smart currency recommendation response."""
    recommended_currency: str
    confidence: str  # 'high', 'medium', 'low'
    reason: str
    alternatives: List[str]
    usage_stats: List[CurrencyUsageStat]
    system_info: Dict[str, str]


@router.get("/smart-currency", response_model=SmartCurrencyRecommendation)
async def get_smart_currency_recommendation(
    timezone: Optional[str] = Query(None, description="Client timezone (e.g., 'Asia/Kolkata')"),
    locale: Optional[str] = Query(None, description="Client locale (e.g., 'en-US')"),
    language: Optional[str] = Query('en', description="Current app language"),
    db: Session = Depends(get_db)
):
    """
    Get smart currency recommendation based on:
    - System timezone and region
    - Historical usage patterns
    - Language preferences
    
    This endpoint analyzes the user's calculation history to determine
    the most appropriate default currency automatically.
    """
    try:
        # Timezone to currency mapping
        timezone_currency_map = {
            # North America
            'America/New_York': 'USD', 'America/Chicago': 'USD', 'America/Denver': 'USD',
            'America/Los_Angeles': 'USD', 'America/Phoenix': 'USD', 'America/Toronto': 'CAD',
            'America/Vancouver': 'CAD',
            
            # Europe
            'Europe/London': 'GBP', 'Europe/Paris': 'EUR', 'Europe/Berlin': 'EUR',
            'Europe/Rome': 'EUR', 'Europe/Madrid': 'EUR', 'Europe/Amsterdam': 'EUR',
            'Europe/Brussels': 'EUR', 'Europe/Vienna': 'EUR', 'Europe/Zurich': 'EUR',
            
            # Asia
            'Asia/Kolkata': 'INR', 'Asia/Mumbai': 'INR', 'Asia/Delhi': 'INR',
            'Asia/Tokyo': 'JPY', 'Asia/Seoul': 'JPY', 'Asia/Shanghai': 'CNY',
            'Asia/Beijing': 'CNY', 'Asia/Hong_Kong': 'CNY', 'Asia/Singapore': 'USD',
            
            # Oceania
            'Australia/Sydney': 'AUD', 'Australia/Melbourne': 'AUD',
        }
        
        # Language to currency fallback
        language_currency_map = {
            'en': 'USD', 'hi': 'INR', 'es': 'EUR', 'fr': 'EUR', 'de': 'EUR',
            'ja': 'JPY', 'zh': 'CNY'
        }
        
        # Fetch user's calculation history to analyze currency usage
        history = db.query(Calculation).order_by(Calculation.created_at.desc()).limit(1000).all()
        
        usage_stats = []
        recommended_currency = None
        confidence = 'low'
        reason = ''
        alternatives = []
        
        if history:
            # Count currency usage
            currency_counts = Counter(calc.currency for calc in history)
            total_calculations = len(history)
            
            # Build usage stats
            for currency, count in currency_counts.most_common():
                last_used_calc = next(
                    (calc for calc in history if calc.currency == currency),
                    None
                )
                usage_stats.append(CurrencyUsageStat(
                    currency=currency,
                    count=count,
                    last_used=last_used_calc.created_at.isoformat() if last_used_calc else '',
                    percentage=round((count / total_calculations) * 100, 2)
                ))
            
            # Priority 1: Historical usage (if user has significant history)
            if usage_stats and usage_stats[0].count >= 3:
                recommended_currency = usage_stats[0].currency
                confidence = 'high' if usage_stats[0].percentage >= 60 else 'medium'
                reason = f"Based on your usage history ({usage_stats[0].count} calculations, {usage_stats[0].percentage:.0f}%)"
                alternatives = [stat.currency for stat in usage_stats[1:4]]
        
        # Priority 2: Timezone-based detection
        if not recommended_currency and timezone:
            if timezone in timezone_currency_map:
                recommended_currency = timezone_currency_map[timezone]
                confidence = 'high'
                reason = f"Based on your system timezone ({timezone})"
            else:
                # Try region-based matching
                region = timezone.split('/')[0] if '/' in timezone else None
                if region == 'America':
                    recommended_currency = 'USD'
                    confidence = 'medium'
                    reason = f"Based on your region ({region})"
                elif region == 'Europe':
                    recommended_currency = 'EUR'
                    confidence = 'medium'
                    reason = f"Based on your region ({region})"
                elif region == 'Asia':
                    if 'India' in timezone or 'Kolkata' in timezone:
                        recommended_currency = 'INR'
                    elif 'Tokyo' in timezone or 'Japan' in timezone:
                        recommended_currency = 'JPY'
                    elif 'China' in timezone or 'Shanghai' in timezone or 'Beijing' in timezone:
                        recommended_currency = 'CNY'
                    else:
                        recommended_currency = 'USD'
                    confidence = 'medium'
                    reason = f"Based on your timezone ({timezone})"
                elif region in ['Australia', 'Pacific']:
                    recommended_currency = 'AUD'
                    confidence = 'medium'
                    reason = f"Based on your region ({region})"
        
        # Priority 3: Language-based fallback
        if not recommended_currency:
            recommended_currency = language_currency_map.get(language, 'USD')
            confidence = 'medium'
            reason = f"Based on your app language ({language})"
        
        # Set alternatives if not already set
        if not alternatives:
            if timezone:
                region = timezone.split('/')[0] if '/' in timezone else None
                if region == 'America':
                    alternatives = ['USD', 'CAD']
                elif region == 'Europe':
                    alternatives = ['EUR', 'GBP']
                elif region == 'Asia':
                    alternatives = ['INR', 'JPY', 'CNY', 'USD']
                elif region in ['Australia', 'Pacific']:
                    alternatives = ['AUD', 'USD']
                else:
                    alternatives = ['USD', 'EUR', 'GBP']
            else:
                alternatives = ['USD', 'EUR', 'GBP', 'INR']
            
            # Remove recommended from alternatives
            alternatives = [c for c in alternatives if c != recommended_currency][:3]
        
        return SmartCurrencyRecommendation(
            recommended_currency=recommended_currency,
            confidence=confidence,
            reason=reason,
            alternatives=alternatives,
            usage_stats=usage_stats,
            system_info={
                'timezone': timezone or 'not provided',
                'locale': locale or 'not provided',
                'language': language,
                'timestamp': datetime.now(timezone).isoformat()
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get smart currency recommendation: {str(e)}"
        )

