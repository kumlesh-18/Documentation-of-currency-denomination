# Start Server - No Installation
# Use this if dependencies are already installed

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Currency Denomination System" -ForegroundColor Cyan
Write-Host "Starting Backend Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to local-backend directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Create necessary directories
New-Item -ItemType Directory -Force -Path "data" | Out-Null
New-Item -ItemType Directory -Force -Path "exports" | Out-Null

# Display startup information
Write-Host "Server starting on: http://127.0.0.1:8001" -ForegroundColor Green
Write-Host "API Documentation: http://127.0.0.1:8001/docs" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
