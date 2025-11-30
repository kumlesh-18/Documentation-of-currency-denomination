# Quick Start Script for Local Backend
# Run this script to set up and start the local backend

param(
    [switch]$SkipDependencyCheck
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Currency Denomination System" -ForegroundColor Cyan
Write-Host "Local Backend - Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to local-backend directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Check for auto-installer and run if available
$AUTO_INSTALL_SCRIPT = Join-Path $scriptPath "start_with_auto_install.ps1"
if ((Test-Path $AUTO_INSTALL_SCRIPT) -and -not $SkipDependencyCheck) {
    Write-Host "Running with automatic dependency installation..." -ForegroundColor Green
    Write-Host ""
    
    # Hand off to auto-installer
    & PowerShell.exe -ExecutionPolicy Bypass -File $AUTO_INSTALL_SCRIPT
    exit $LASTEXITCODE
}

# Fallback: Manual mode (if auto-installer not available or skipped)
Write-Host "Running in manual mode..." -ForegroundColor Yellow
Write-Host ""

# Check Python version
Write-Host "Checking Python version..." -ForegroundColor Yellow
python --version 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    $pyVer = python --version 2>&1
    Write-Host "Found: Python installed" -ForegroundColor Green
} else {
    Write-Host "Python not found. Please install Python 3.11 or higher." -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "Working directory: $pwd" -ForegroundColor Yellow
Write-Host ""

# Note: Using system Python (venv optional)
Write-Host "Using system Python installation" -ForegroundColor Gray
Write-Host ""

# Install/update dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Write-Host "This may take 2-3 minutes on first run..." -ForegroundColor Gray

# Check if already installed
$pipList = pip list 2>&1 | Out-String
if ($pipList -match "fastapi" -and $pipList -match "uvicorn") {
    Write-Host "Dependencies already installed" -ForegroundColor Green
} else {
    # Install essential packages only
    Write-Host "Installing FastAPI, Uvicorn, SQLAlchemy, Pydantic..." -ForegroundColor Gray
    pip install fastapi uvicorn sqlalchemy pydantic --quiet --disable-pip-version-check
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "Warning: Some dependencies may not have installed" -ForegroundColor Yellow
        Write-Host "The server will attempt to start anyway..." -ForegroundColor Gray
    }
}
Write-Host ""

# Create necessary directories
Write-Host "Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "data" | Out-Null
New-Item -ItemType Directory -Force -Path "exports" | Out-Null
Write-Host "Directories created" -ForegroundColor Green
Write-Host ""

# Display startup information
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Local Backend API Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server will start on: http://127.0.0.1:8001" -ForegroundColor Green
Write-Host "Interactive Docs:     http://127.0.0.1:8001/docs" -ForegroundColor Green
Write-Host "Alternative Docs:     http://127.0.0.1:8001/redoc" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
