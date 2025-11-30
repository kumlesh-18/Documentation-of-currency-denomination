"""
Export API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional, List
import csv
import json
from datetime import datetime
from pathlib import Path
from io import StringIO, BytesIO

from app.database import get_db, Calculation, ExportRecord
from app.config import settings


router = APIRouter()


@router.get("/export/csv")
async def export_history_csv(
    currency: Optional[str] = Query(None, description="Filter by currency"),
    limit: Optional[int] = Query(None, description="Limit number of records"),
    db: Session = Depends(get_db)
):
    """
    Export calculation history to CSV format.
    """
    try:
        # Build query
        query = db.query(Calculation)
        
        if currency:
            query = query.filter(Calculation.currency == currency.upper())
        
        if limit:
            query = query.limit(limit)
        
        calculations = query.order_by(Calculation.created_at.desc()).all()
        
        # Create CSV
        output = StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            'ID', 'Date', 'Amount', 'Currency', 
            'Total Notes', 'Total Coins', 'Total Denominations',
            'Optimization Mode', 'Source', 'Synced'
        ])
        
        # Data rows
        for calc in calculations:
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
                'Yes' if calc.synced else 'No'
            ])
        
        # Save to file
        filename = f"history_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        filepath = settings.EXPORT_DIR / filename
        
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            f.write(output.getvalue())
        
        # Record export
        export_record = ExportRecord(
            export_type='csv',
            file_path=str(filepath),
            item_count=len(calculations),
            file_size_bytes=filepath.stat().st_size
        )
        db.add(export_record)
        db.commit()
        
        return FileResponse(
            path=filepath,
            filename=filename,
            media_type='text/csv'
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.get("/export/calculation/{calculation_id}/csv")
async def export_single_csv(
    calculation_id: int,
    db: Session = Depends(get_db)
):
    """Export a single calculation breakdown to CSV."""
    try:
        calc = db.query(Calculation).filter(Calculation.id == calculation_id).first()
        
        if not calc:
            raise HTTPException(status_code=404, detail="Calculation not found")
        
        # Parse result
        result_data = json.loads(calc.result)
        breakdowns = result_data.get('breakdowns', [])
        
        # Create CSV
        output = StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(['Denomination', 'Count', 'Total Value', 'Type'])
        
        # Data rows
        for b in breakdowns:
            writer.writerow([
                b['denomination'],
                b['count'],
                b['total_value'],
                'Note' if b['is_note'] else 'Coin'
            ])
        
        # Summary
        writer.writerow([])
        writer.writerow(['Summary', '', '', ''])
        writer.writerow(['Total Notes', calc.total_notes, '', ''])
        writer.writerow(['Total Coins', calc.total_coins, '', ''])
        writer.writerow(['Total Denominations', calc.total_denominations, '', ''])
        
        # Save to file
        filename = f"calculation_{calculation_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        filepath = settings.EXPORT_DIR / filename
        
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            f.write(output.getvalue())
        
        return FileResponse(
            path=filepath,
            filename=filename,
            media_type='text/csv'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.get("/export/formats")
async def get_export_formats():
    """Get available export formats."""
    return {
        "formats": [
            {
                "type": "csv",
                "name": "CSV",
                "description": "Comma-separated values",
                "supported": True
            },
            {
                "type": "excel",
                "name": "Excel",
                "description": "Microsoft Excel spreadsheet",
                "supported": False,
                "note": "Coming soon"
            },
            {
                "type": "pdf",
                "name": "PDF",
                "description": "Portable Document Format",
                "supported": False,
                "note": "Coming soon"
            }
        ]
    }
