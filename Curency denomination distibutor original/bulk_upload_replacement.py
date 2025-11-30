"""
Replacement code for bulk_upload endpoint in calculations.py

Replace the existing bulk_upload_csv function (lines ~290-510) with this code.
Also add the parse_csv_file helper function at the end.
"""

@router.post("/bulk-upload", response_model=BulkUploadResponse)
async def bulk_upload_file(
    file: UploadFile = File(..., description="Upload: CSV, PDF, Word (.docx), or Image (JPG/PNG/etc.)"),
    save_to_history: bool = True,
    db: Session = Depends(get_db)
):
    """
    Bulk upload file for batch calculations - supports multiple formats with OCR.
    
    Supported Formats:
    - CSV files (.csv)
    - PDF files (.pdf) - text-based or scanned
    - Word documents (.docx)
    - Images (.jpg, .png, .tiff, .bmp, .gif, .webp)
    
    CSV Format:
    - Required columns: amount, currency
    - Optional: optimization_mode
    - Headers case-insensitive
    
    Other Formats (OCR):
    - Automatic text extraction
    - Parses amounts, currencies, modes
    - Supports tabular, CSV-like, or natural language format
    
    OCR Features:
    - Error correction (USO→USD, l00→100)
    - Case-insensitive
    - Offline after initial setup
    
    Returns: Detailed results for each row + statistics
    """
    import time
    start_time = time.time()
    
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
            detail=f"Unsupported file: {file_ext}. Supported: CSV, PDF, Word, Images (JPG/PNG/TIFF/BMP)"
        )
    
    try:
        contents = await file.read()
        
        # Route to appropriate processor
        if file_ext in csv_ext:
            rows_data = parse_csv_file(contents, file.filename)
        else:
            # OCR processing
            ocr_processor = get_ocr_processor()
            deps = ocr_processor.check_dependencies()
            
            # Check required dependencies
            missing = []
            if file_ext in pdf_ext and not deps['pymupdf']:
                missing.append('PyMuPDF')
            if file_ext in word_ext and not deps['docx']:
                missing.append('python-docx')
            if file_ext in image_ext and not deps['tesseract']:
                missing.append('Tesseract OCR')
            if file_ext in pdf_ext and not deps['pdf2image']:
                missing.append('pdf2image')
            
            if missing:
                raise HTTPException(
                    status_code=503,
                    detail=f"OCR not ready: {', '.join(missing)}. Run: install_ocr_dependencies.ps1"
                )
            
            try:
                rows_data = ocr_processor.process_file(contents, file.filename)
            except Exception as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to process {file_ext}: {str(e)}"
                )
        
        # Process each row
        results = []
        successful_count = 0
        failed_count = 0
        
        for row_data in rows_data:
            row_num = row_data.get('line_number', row_data.get('row_number', 0))
            
            try:
                amount_str = row_data.get('amount', '').strip()
                currency_raw = row_data.get('currency', '').strip()
                optimization_raw = row_data.get('optimization_mode', '').strip()
                
                if not amount_str:
                    raise ValueError("Amount is required")
                if not currency_raw:
                    raise ValueError("Currency is required")
                
                currency = currency_raw.upper()
                if len(currency) != 3:
                    raise ValueError(f"Currency must be 3-letter code, got: {currency_raw}")
                
                valid_modes = ['greedy', 'balanced', 'minimize_large', 'minimize_small']
                optimization_mode = optimization_raw.lower() if optimization_raw else 'greedy'
                if optimization_mode not in valid_modes:
                    optimization_mode = 'greedy'
                
                amount_decimal = Decimal(amount_str)
                if amount_decimal <= 0:
                    raise ValueError("Amount must be positive")
                
                core_request = CoreRequest(
                    amount=amount_decimal,
                    currency=currency,
                    optimization_mode=OptimizationMode(optimization_mode)
                )
                
                result = denomination_engine.calculate(core_request)
                
                calculation_id = None
                if save_to_history:
                    db_calc = Calculation(
                        amount=str(result.original_amount),
                        currency=result.currency,
                        source_currency=None,
                        exchange_rate=None,
                        optimization_mode=optimization_mode,
                        result=json.dumps(result.to_dict()),
                        total_notes=str(result.total_notes),
                        total_coins=str(result.total_coins),
                        total_denominations=str(result.total_denominations),
                        source="bulk_upload",
                        synced=False
                    )
                    db.add(db_calc)
                    db.commit()
                    db.refresh(db_calc)
                    calculation_id = db_calc.id
                
                results.append(BulkCalculationRow(
                    row_number=row_num,
                    status="success",
                    amount=str(result.original_amount),
                    currency=result.currency,
                    optimization_mode=optimization_mode,
                    total_notes=result.total_notes,
                    total_coins=result.total_coins,
                    total_denominations=result.total_denominations,
                    breakdowns=[
                        {
                            "denomination": str(b.denomination),
                            "count": b.count,
                            "total_value": str(b.total_value),
                            "is_note": b.is_note
                        }
                        for b in result.breakdowns
                    ],
                    calculation_id=calculation_id
                ))
                successful_count += 1
                
            except ValueError as e:
                results.append(BulkCalculationRow(
                    row_number=row_num,
                    status="error",
                    amount=row_data.get('amount', ''),
                    currency=row_data.get('currency', ''),
                    error_message=str(e)
                ))
                failed_count += 1
            except Exception as e:
                results.append(BulkCalculationRow(
                    row_number=row_num,
                    status="error",
                    amount=row_data.get('amount', ''),
                    currency=row_data.get('currency', ''),
                    error_message=f"Unexpected: {str(e)}"
                ))
                failed_count += 1
        
        processing_time = time.time() - start_time
        
        return BulkUploadResponse(
            total_rows=len(results),
            successful=successful_count,
            failed=failed_count,
            results=results,
            processing_time_seconds=round(processing_time, 3),
            saved_to_history=save_to_history
        )
        
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Encoding error. Use UTF-8 or binary format"
        )
    except csv.Error as e:
        raise HTTPException(
            status_code=400,
            detail=f"CSV error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}"
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
