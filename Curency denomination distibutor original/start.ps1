# Quick Start Script - Currency Denomination System

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Currency Denomination System" -ForegroundColor Cyan
Write-Host "Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Display menu
Write-Host "Choose an option:" -ForegroundColor Yellow
Write-Host "  1. Start Local Backend API (FastAPI)" -ForegroundColor White
Write-Host "  2. Run Core Engine Tests" -ForegroundColor White
Write-Host "  3. View Documentation" -ForegroundColor White
Write-Host "  4. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Starting Local Backend..." -ForegroundColor Green
        Set-Location "packages\local-backend"
        .\start.ps1
    }
    "2" {
        Write-Host ""
        Write-Host "Running Tests..." -ForegroundColor Green
        Set-Location "packages\core-engine"
        .\test.ps1
    }
    "3" {
        Write-Host ""
        Write-Host "Opening Documentation..." -ForegroundColor Green
        if (Test-Path "INDEX.md") {
            code INDEX.md
        } else {
            Write-Host "INDEX.md not found. Opening README.md..." -ForegroundColor Yellow
            if (Test-Path "README.md") {
                code README.md
            } else {
                Write-Host "Documentation files not found." -ForegroundColor Red
            }
        }
    }
    "4" {
        Write-Host "Goodbye!" -ForegroundColor Cyan
        exit 0
    }
    default {
        Write-Host "Invalid choice. Exiting." -ForegroundColor Red
        exit 1
    }
}
