# Test Bulk Upload - Quick Verification Script
# This script tests the bulk upload functionality

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Bulk Upload Test - Quick Verification" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
Write-Host "1. Checking backend status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8001/health" -ErrorAction Stop -TimeoutSec 5
    Write-Host "   [OK] Backend is running on port 8001" -ForegroundColor Green
} 
catch {
    Write-Host "   [FAIL] Backend is NOT running!" -ForegroundColor Red
    Write-Host "   Start backend with: python -m uvicorn app.main:app --reload" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check for test file
Write-Host "2. Checking test file..." -ForegroundColor Yellow
$testFile = "test_bulk_upload.csv"
if (Test-Path $testFile) {
    Write-Host "   [OK] Test file found: $testFile" -ForegroundColor Green
} 
else {
    Write-Host "   [INFO] Test file not found, creating..." -ForegroundColor Yellow
    
    $csvContent = "amount,currency,optimization_mode`n1000,INR,greedy`n250.50,USD,balanced`n500,EUR,minimize_large`n100,GBP,minimize_small"
    
    $csvContent | Out-File -FilePath $testFile -Encoding UTF8
    Write-Host "   [OK] Test file created: $testFile" -ForegroundColor Green
}

Write-Host ""

# Test the upload
Write-Host "3. Testing bulk upload..." -ForegroundColor Yellow
try {
    $url = "http://127.0.0.1:8001/api/v1/bulk-upload?save_to_history=false"
    
    # Using curl for file upload
    $jsonResult = curl.exe -X POST $url -F "file=@$testFile" -H "accept: application/json" 2>$null
    $result = $jsonResult | ConvertFrom-Json
    
    if ($result.total_rows -gt 0) {
        Write-Host "   [OK] Upload successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "   Results:" -ForegroundColor Cyan
        Write-Host "   ----------------------------------------" -ForegroundColor Gray
        Write-Host "   Total Rows:       $($result.total_rows)" -ForegroundColor White
        Write-Host "   Successful:       $($result.successful)" -ForegroundColor Green
        Write-Host "   Failed:           $($result.failed)" -ForegroundColor $(if ($result.failed -eq 0) { "Green" } else { "Red" })
        Write-Host "   Processing Time:  $($result.processing_time_seconds)s" -ForegroundColor White
        Write-Host "   ----------------------------------------" -ForegroundColor Gray
        Write-Host ""
        
        # Show individual results
        Write-Host "   Row Details:" -ForegroundColor Cyan
        foreach ($row in $result.results) {
            if ($row.status -eq "success") {
                Write-Host "   [OK] Row $($row.row_number): $($row.amount) $($row.currency) -> $($row.total_denominations) denominations" -ForegroundColor Green
            } 
            else {
                Write-Host "   [FAIL] Row $($row.row_number): ERROR - $($row.error)" -ForegroundColor Red
            }
        }
    } 
    else {
        Write-Host "   [FAIL] Upload returned no results" -ForegroundColor Red
    }
} 
catch {
    Write-Host "   [FAIL] Upload failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Test Complete" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Start frontend: cd packages\desktop-app; npm run dev" -ForegroundColor White
Write-Host "  2. Open browser: http://localhost:5173" -ForegroundColor White
Write-Host "  3. Test upload through the UI" -ForegroundColor White
Write-Host ""
