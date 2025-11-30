#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Test Smart Defaults Upload
.DESCRIPTION
    Tests the enhanced OCR bulk upload with smart defaults
    Uploads a file with various formats to verify intelligent extraction
#>

# Set error action
$ErrorActionPreference = "Stop"

Write-Host "`n" -NoNewline
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" * 78 -ForegroundColor Cyan
Write-Host "Testing Smart Defaults - OCR Bulk Upload" -ForegroundColor Cyan
Write-Host "=" * 79 -ForegroundColor Cyan
Write-Host ""

# Configuration
$API_URL = "http://127.0.0.1:8001"
$TEST_FILE = "test_smart_defaults_upload.txt"
$EXPECTED_RESULTS = @(
    @{Amount="5000"; Currency="INR"; Mode="greedy"},
    @{Amount="10000"; Currency="INR"; Mode="greedy"},
    @{Amount="15000"; Currency="USD"; Mode="greedy"},
    @{Amount="20000"; Currency="INR"; Mode="greedy"},
    @{Amount="25000"; Currency="EUR"; Mode="balanced"},
    @{Amount="30000"; Currency="INR"; Mode="greedy"},
    @{Amount="35000"; Currency="USD"; Mode="greedy"},
    @{Amount="40000"; Currency="INR"; Mode="greedy"}
)

# Check if server is running
Write-Host "Checking if server is running..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-RestMethod -Uri "$API_URL/health" -Method GET -TimeoutSec 5
    Write-Host "✓ Server is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Server is NOT running!" -ForegroundColor Red
    Write-Host "Please start the server first:" -ForegroundColor Yellow
    Write-Host "  cd packages\local-backend" -ForegroundColor Cyan
    Write-Host "  .\start.ps1" -ForegroundColor Cyan
    exit 1
}

# Check if test file exists
if (-not (Test-Path $TEST_FILE)) {
    Write-Host "✗ Test file not found: $TEST_FILE" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Test file found: $TEST_FILE" -ForegroundColor Green
Write-Host ""

# Read and display test file content
Write-Host "Test File Contents:" -ForegroundColor Yellow
Write-Host "-" * 79 -ForegroundColor Gray
Get-Content $TEST_FILE | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
Write-Host "-" * 79 -ForegroundColor Gray
Write-Host ""

# Upload file
Write-Host "Uploading file to API..." -ForegroundColor Yellow

try {
    # Prepare multipart form data
    $filePath = (Resolve-Path $TEST_FILE).Path
    $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
    $fileEnc = [System.Text.Encoding]::GetEncoding('ISO-8859-1').GetString($fileBytes)
    
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    
    $bodyLines = (
        "--$boundary",
        "Content-Disposition: form-data; name=`"file`"; filename=`"$TEST_FILE`"",
        "Content-Type: text/plain$LF",
        $fileEnc,
        "--$boundary--$LF"
    ) -join $LF
    
    $response = Invoke-RestMethod -Uri "$API_URL/api/calculations/bulk-upload" `
        -Method POST `
        -ContentType "multipart/form-data; boundary=$boundary" `
        -Body $bodyLines
    
    Write-Host "✓ Upload successful!" -ForegroundColor Green
    Write-Host ""
    
    # Display results
    Write-Host "=" * 79 -ForegroundColor Cyan
    Write-Host "Upload Results" -ForegroundColor Cyan
    Write-Host "=" * 79 -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Total rows uploaded: $($response.total_rows)" -ForegroundColor White
    Write-Host "Successful: $($response.successful_rows)" -ForegroundColor Green
    Write-Host "Failed: $($response.failed_rows)" -ForegroundColor $(if ($response.failed_rows -gt 0) { "Red" } else { "Green" })
    Write-Host ""
    
    if ($response.results) {
        Write-Host "Row Details:" -ForegroundColor Yellow
        Write-Host "-" * 79 -ForegroundColor Gray
        
        $passedTests = 0
        $failedTests = 0
        
        for ($i = 0; $i -lt $response.results.Count; $i++) {
            $result = $response.results[$i]
            $expected = $EXPECTED_RESULTS[$i]
            
            # Extract actual values from result
            $actualAmount = [math]::Floor([decimal]$result.request.amount)
            $actualCurrency = $result.request.currency
            $actualMode = $result.request.optimization_mode
            
            # Compare with expected
            $amountMatch = $actualAmount -eq [decimal]$expected.Amount
            $currencyMatch = $actualCurrency -eq $expected.Currency
            $modeMatch = $actualMode -eq $expected.Mode
            
            $allMatch = $amountMatch -and $currencyMatch -and $modeMatch
            
            if ($allMatch) {
                $status = "✓"
                $color = "Green"
                $passedTests++
            } else {
                $status = "✗"
                $color = "Red"
                $failedTests++
            }
            
            Write-Host "$status Row $($i + 1):" -ForegroundColor $color -NoNewline
            Write-Host " $actualAmount $actualCurrency $actualMode" -ForegroundColor White
            
            if (-not $allMatch) {
                Write-Host "    Expected: $($expected.Amount) $($expected.Currency) $($expected.Mode)" -ForegroundColor Yellow
            }
        }
        
        Write-Host "-" * 79 -ForegroundColor Gray
        Write-Host ""
        
        # Test summary
        Write-Host "=" * 79 -ForegroundColor Cyan
        Write-Host "Test Summary" -ForegroundColor Cyan
        Write-Host "=" * 79 -ForegroundColor Cyan
        Write-Host "Total Tests: $($EXPECTED_RESULTS.Count)" -ForegroundColor White
        Write-Host "Passed: $passedTests" -ForegroundColor Green
        Write-Host "Failed: $failedTests" -ForegroundColor $(if ($failedTests -gt 0) { "Red" } else { "Green" })
        
        if ($failedTests -eq 0) {
            Write-Host ""
            Write-Host "🎉 ALL TESTS PASSED! Smart defaults working perfectly!" -ForegroundColor Green
            exit 0
        } else {
            Write-Host ""
            Write-Host "⚠️  Some tests failed. Review output above." -ForegroundColor Yellow
            exit 1
        }
    }
    
} catch {
    Write-Host "✗ Upload failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
