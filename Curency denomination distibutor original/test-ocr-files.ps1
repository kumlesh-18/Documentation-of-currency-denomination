# Test OCR File Uploads
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Testing OCR File Uploads (PDF & Image)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$apiUrl = "http://127.0.0.1:8001/api/v1/bulk-upload?save_to_history=false"

# Test 1: Image upload
Write-Host "1. Testing PNG Image Upload..." -ForegroundColor Yellow
if (Test-Path "test_bulk_image.png") {
    try {
        $result = curl.exe -X POST $apiUrl -F "file=@test_bulk_image.png" 2>$null | ConvertFrom-Json
        Write-Host "   [OK] Image processed: $($result.successful)/$($result.total_rows) rows succeeded" -ForegroundColor Green
        
        foreach ($row in $result.results) {
            if ($row.status -eq "success") {
                Write-Host "     [OK] Row $($row.row_number): $($row.amount) $($row.currency)" -ForegroundColor Green
            } else {
                Write-Host "     [FAIL] Row $($row.row_number): $($row.error)" -ForegroundColor Red
            }
        }
    } catch {
        Write-Host "   [FAIL] Image upload failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "   [SKIP] test_bulk_image.png not found" -ForegroundColor Yellow
}

Write-Host ""

# Test 2: PDF upload
Write-Host "2. Testing PDF Upload..." -ForegroundColor Yellow
if (Test-Path "test_bulk.pdf") {
    try {
        $result = curl.exe -X POST $apiUrl -F "file=@test_bulk.pdf" 2>$null | ConvertFrom-Json
        Write-Host "   [OK] PDF processed: $($result.successful)/$($result.total_rows) rows succeeded" -ForegroundColor Green
        
        foreach ($row in $result.results) {
            if ($row.status -eq "success") {
                Write-Host "     [OK] Row $($row.row_number): $($row.amount) $($row.currency)" -ForegroundColor Green
            } else {
                Write-Host "     [FAIL] Row $($row.row_number): $($row.error)" -ForegroundColor Red
            }
        }
    } catch {
        Write-Host "   [FAIL] PDF upload failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "   [SKIP] test_bulk.pdf not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  OCR Test Complete" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "FILES CREATED:" -ForegroundColor Yellow
if (Test-Path "test_bulk_image.png") { Write-Host "  - test_bulk_image.png" -ForegroundColor Green }
if (Test-Path "test_bulk.pdf") { Write-Host "  - test_bulk.pdf" -ForegroundColor Green }
Write-Host ""
Write-Host "You can now upload these files through the frontend UI!" -ForegroundColor Cyan
