"""
History API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import json
import csv
import io

from app.database import get_db, Calculation
from app.config import settings


router = APIRouter()


class HistoryItem(BaseModel):
    """History item response model."""
    id: int
    amount: str
    currency: str
    total_notes: int
    total_coins: int
    total_denominations: int
    optimization_mode: str
    source: str
    synced: bool
    created_at: datetime
    
    @classmethod
    def from_db(cls, db_item):
        """Convert database item to response model, handling string to int conversion."""
        # Ensure datetime is timezone-aware (treat as UTC if naive)
        created_at = db_item.created_at
        if created_at and created_at.tzinfo is None:
            from datetime import timezone
            created_at = created_at.replace(tzinfo=timezone.utc)
        
        return cls(
            id=db_item.id,
            amount=db_item.amount,
            currency=db_item.currency,
            total_notes=int(db_item.total_notes) if db_item.total_notes else 0,
            total_coins=int(db_item.total_coins) if db_item.total_coins else 0,
            total_denominations=int(db_item.total_denominations) if db_item.total_denominations else 0,
            optimization_mode=db_item.optimization_mode,
            source=db_item.source,
            synced=db_item.synced,
            created_at=created_at
        )
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class HistoryResponse(BaseModel):
    """History list response."""
    items: List[HistoryItem]
    total: int
    page: int
    page_size: int
    has_more: bool


@router.get("/history", response_model=HistoryResponse)
async def get_history(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=1000, description="Items per page"),
    currency: Optional[str] = Query(None, description="Filter by currency"),
    synced: Optional[bool] = Query(None, description="Filter by sync status"),
    db: Session = Depends(get_db)
):
    """
    Get calculation history with pagination and filtering.
    """
    try:
        # Build query
        query = db.query(Calculation)
        
        # Apply filters
        if currency:
            query = query.filter(Calculation.currency == currency.upper())
        
        if synced is not None:
            query = query.filter(Calculation.synced == synced)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * page_size
        items = query.order_by(desc(Calculation.created_at)).offset(offset).limit(page_size).all()
        
        # Check if there are more items
        has_more = total > (page * page_size)
        
        return HistoryResponse(
            items=[HistoryItem.from_db(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
            has_more=has_more
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/quick-access")
async def get_quick_access(
    count: int = Query(settings.QUICK_ACCESS_COUNT, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Get last N calculations for quick access sidebar.
    
    This is optimized for the desktop app's quick access feature.
    """
    try:
        items = db.query(Calculation).order_by(
            desc(Calculation.created_at)
        ).limit(count).all()
        
        return {
            "items": [HistoryItem.from_db(item) for item in items],
            "count": len(items)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{calculation_id}")
async def get_calculation_detail(
    calculation_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific calculation."""
    try:
        from datetime import timezone
        
        calc = db.query(Calculation).filter(Calculation.id == calculation_id).first()
        
        if not calc:
            raise HTTPException(status_code=404, detail="Calculation not found")
        
        # Parse result JSON
        result_data = json.loads(calc.result)
        
        # Convert string totals back to integers
        total_notes = int(calc.total_notes) if calc.total_notes else 0
        total_coins = int(calc.total_coins) if calc.total_coins else 0
        total_denominations = int(calc.total_denominations) if calc.total_denominations else 0
        
        # Ensure datetime is timezone-aware (treat as UTC if naive)
        created_at = calc.created_at
        if created_at and created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        
        updated_at = calc.updated_at
        if updated_at and updated_at.tzinfo is None:
            updated_at = updated_at.replace(tzinfo=timezone.utc)
        
        return {
            "id": calc.id,
            "amount": calc.amount,
            "currency": calc.currency,
            "source_currency": calc.source_currency,
            "exchange_rate": calc.exchange_rate,
            "optimization_mode": calc.optimization_mode,
            "result": result_data,
            "total_notes": total_notes,
            "total_coins": total_coins,
            "total_denominations": total_denominations,
            "source": calc.source,
            "synced": calc.synced,
            "created_at": created_at.isoformat() if created_at else None,
            "updated_at": updated_at.isoformat() if updated_at else None
        }
        
    except HTTPException:
        raise
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse calculation result: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/history/{calculation_id}")
async def delete_calculation(
    calculation_id: int,
    db: Session = Depends(get_db)
):
    """Delete a calculation from history."""
    try:
        calc = db.query(Calculation).filter(Calculation.id == calculation_id).first()
        
        if not calc:
            raise HTTPException(status_code=404, detail="Calculation not found")
        
        db.delete(calc)
        db.commit()
        
        return {"message": "Calculation deleted successfully", "id": calculation_id}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/history")
async def clear_history(
    older_than_days: Optional[int] = Query(None, description="Delete items older than N days"),
    currency: Optional[str] = Query(None, description="Delete only specific currency"),
    db: Session = Depends(get_db)
):
    """
    Clear calculation history with optional filters.
    """
    try:
        query = db.query(Calculation)
        
        # Apply filters
        if older_than_days:
            cutoff_date = datetime.utcnow() - timedelta(days=older_than_days)
            query = query.filter(Calculation.created_at < cutoff_date)
        
        if currency:
            query = query.filter(Calculation.currency == currency.upper())
        
        deleted_count = query.delete()
        db.commit()
        
        return {
            "message": "History cleared successfully",
            "deleted_count": deleted_count
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/stats")
async def get_history_stats(db: Session = Depends(get_db)):
    """Get statistics about calculation history."""
    try:
        total_calculations = db.query(Calculation).count()
        
        # Count by currency
        currencies = {}
        currency_results = db.query(
            Calculation.currency,
            db.func.count(Calculation.id)
        ).group_by(Calculation.currency).all()
        
        for currency, count in currency_results:
            currencies[currency] = count
        
        # Count synced vs unsynced
        synced_count = db.query(Calculation).filter(Calculation.synced == True).count()
        unsynced_count = db.query(Calculation).filter(Calculation.synced == False).count()
        
        # Most recent
        most_recent = db.query(Calculation).order_by(
            desc(Calculation.created_at)
        ).first()
        
        return {
            "total_calculations": total_calculations,
            "by_currency": currencies,
            "synced": synced_count,
            "unsynced": unsynced_count,
            "most_recent": most_recent.created_at if most_recent else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class BulkDeleteRequest(BaseModel):
    """Request model for bulk delete."""
    ids: List[int]


@router.post("/history/bulk-delete")
async def bulk_delete_calculations(
    request: BulkDeleteRequest,
    db: Session = Depends(get_db)
):
    """Delete multiple calculations by IDs."""
    try:
        if not request.ids:
            raise HTTPException(status_code=400, detail="No IDs provided")
        
        deleted_count = db.query(Calculation).filter(
            Calculation.id.in_(request.ids)
        ).delete(synchronize_session=False)
        
        db.commit()
        
        return {
            "message": f"Deleted {deleted_count} calculations",
            "deleted_count": deleted_count,
            "requested_count": len(request.ids)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


class ExportRequest(BaseModel):
    """Request model for exporting history."""
    ids: Optional[List[int]] = None  # If None, export all
    currency: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


@router.post("/history/export/csv")
async def export_history_csv(
    request: ExportRequest,
    db: Session = Depends(get_db)
):
    """Export calculation history to CSV."""
    try:
        # Build query
        query = db.query(Calculation)
        
        # Apply filters
        if request.ids:
            query = query.filter(Calculation.id.in_(request.ids))
        
        if request.currency:
            query = query.filter(Calculation.currency == request.currency.upper())
        
        if request.start_date:
            query = query.filter(Calculation.created_at >= request.start_date)
        
        if request.end_date:
            query = query.filter(Calculation.created_at <= request.end_date)
        
        # Get calculations
        calculations = query.order_by(desc(Calculation.created_at)).all()
        
        if not calculations:
            raise HTTPException(status_code=404, detail="No calculations found")
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'ID', 'Date', 'Amount', 'Currency', 
            'Total Notes', 'Total Coins', 'Total Denominations',
            'Optimization Mode', 'Source', 'Breakdown Details'
        ])
        
        # Write data
        for calc in calculations:
            result_data = json.loads(calc.result)
            breakdowns_summary = "; ".join([
                f"{b['count']}x{b['denomination']}" 
                for b in result_data.get('breakdowns', [])
            ])
            
            writer.writerow([
                calc.id,
                calc.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                calc.amount,
                calc.currency,
                calc.total_notes,
                calc.total_coins,
                calc.total_denominations,
                calc.optimization_mode,
                calc.source,
                breakdowns_summary
            ])
        
        # Prepare response
        output.seek(0)
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=history_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

