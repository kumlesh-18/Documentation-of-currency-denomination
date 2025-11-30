# Test Core Engine - Quick Test Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Currency Denomination Engine" -ForegroundColor Cyan
Write-Host "Running Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to core-engine directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Working directory: $pwd" -ForegroundColor Yellow
Write-Host ""

# Run quick verification by default
Write-Host "Running Quick Verification - 6 tests..." -ForegroundColor Yellow
Write-Host "For full test suite, run: python test_engine.py" -ForegroundColor Gray
Write-Host ""

python verify.py

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "All tests passed!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Tip: Run 'python test_engine.py' for comprehensive 7-test suite" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Tests failed" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    exit 1
}
