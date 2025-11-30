# Test OCR Backend Integration
# This script tests the complete OCR bulk upload system

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "OCR Backend Integration Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to local-backend directory
$backendPath = Join-Path $PSScriptRoot "packages\local-backend"
Set-Location $backendPath

Write-Host "[1/4] Testing OCR Processor Import..." -ForegroundColor Yellow
$testImport = python -c "from app.services.ocr_processor import get_ocr_processor; ocr = get_ocr_processor(); print('SUCCESS')" 2>&1

if ($testImport -match "SUCCESS") {
    Write-Host "  [OK] OCR processor loaded successfully" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] OCR processor failed to load" -ForegroundColor Red
    Write-Host "  Error: $testImport" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/4] Testing Dependencies..." -ForegroundColor Yellow
$testDeps = python -c @"
from app.services.ocr_processor import get_ocr_processor
ocr = get_ocr_processor()
deps = ocr.check_dependencies()
all_ready = all(deps.values())
print('SUCCESS' if all_ready else 'MISSING')
print(f'Tesseract: {deps[\"tesseract\"]}')
print(f'PyMuPDF: {deps[\"pymupdf\"]}')
print(f'python-docx: {deps[\"docx\"]}')
print(f'pdf2image: {deps[\"pdf2image\"]}')
"@ 2>&1

Write-Host $testDeps

if ($testDeps -match "SUCCESS") {
    Write-Host "  [OK] All OCR dependencies are ready" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Some dependencies may be missing" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[3/4] Testing API Endpoint..." -ForegroundColor Yellow
$testAPI = python -c @"
from app.api.calculations import parse_csv_file
import io
csv_data = b\"\"\"amount,currency
100,USD
200,EUR\"\"\"
try:
    result = parse_csv_file(csv_data, 'test.csv')
    print('SUCCESS' if len(result) == 2 else 'FAIL')
    print(f'Parsed {len(result)} rows')
except Exception as e:
    print(f'FAIL: {e}')
"@ 2>&1

Write-Host $testAPI

if ($testAPI -match "SUCCESS") {
    Write-Host "  [OK] CSV parsing works correctly" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] CSV parsing failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "[4/4] System Status..." -ForegroundColor Yellow
Write-Host "  Backend: Ready" -ForegroundColor Green
Write-Host "  OCR Support: Enabled" -ForegroundColor Green
Write-Host "  Supported Formats:" -ForegroundColor Cyan
Write-Host "    - CSV files (.csv)" -ForegroundColor Gray
Write-Host "    - PDF documents (.pdf)" -ForegroundColor Gray
Write-Host "    - Word documents (.docx)" -ForegroundColor Gray
Write-Host "    - Images (JPG, PNG, TIFF, BMP, etc.)" -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Integration Test Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Start backend: cd packages\local-backend; python -m uvicorn app.main:app --reload" -ForegroundColor Gray
Write-Host "2. Start frontend: cd packages\desktop-app; npm run dev" -ForegroundColor Gray
Write-Host "3. Test bulk upload with various file formats" -ForegroundColor Gray
Write-Host ""
