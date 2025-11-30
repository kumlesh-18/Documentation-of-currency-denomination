# Auto-Start Backend with Dependency Check
# This script automatically installs missing dependencies and starts the backend

param(
    [switch]$SkipDependencyCheck,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

# Script directory
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$INSTALL_SCRIPT = Join-Path $SCRIPT_DIR "install_dependencies.ps1"
$DEPENDENCY_MARKER = Join-Path $SCRIPT_DIR ".dependencies_installed"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Currency Distributor Backend - Auto Startup" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if dependencies need to be installed
$shouldInstall = $false

if ($Force) {
    Write-Host "[INFO] Force flag set, will reinstall dependencies" -ForegroundColor Yellow
    $shouldInstall = $true
} elseif ($SkipDependencyCheck) {
    Write-Host "[INFO] Skipping dependency check" -ForegroundColor Yellow
} elseif (-not (Test-Path $DEPENDENCY_MARKER)) {
    Write-Host "[INFO] First-time setup detected" -ForegroundColor Cyan
    $shouldInstall = $true
} else {
    Write-Host "[INFO] Dependencies previously installed" -ForegroundColor Green
    
    # Quick verification
    $tesseractOk = $false
    $popplerOk = $false
    
    try {
        $null = & tesseract --version 2>&1
        $tesseractOk = ($LASTEXITCODE -eq 0)
    } catch {}
    
    try {
        $null = & pdftoppm -v 2>&1
        $popplerOk = ($LASTEXITCODE -eq 0)
    } catch {}
    
    if (-not $tesseractOk -or -not $popplerOk) {
        Write-Host "[WARNING] Some dependencies missing, will reinstall" -ForegroundColor Yellow
        $shouldInstall = $true
    }
}

# Install dependencies if needed
if ($shouldInstall) {
    Write-Host ""
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    Write-Host "This will download and install Tesseract, Poppler, and Python packages..." -ForegroundColor Cyan
    Write-Host "This may take 5-10 minutes on first run..." -ForegroundColor Yellow
    Write-Host ""
    
    if (Test-Path $INSTALL_SCRIPT) {
        # Run installation script
        $installArgs = @()
        if ($Force) { $installArgs += "-Force" }
        
        & PowerShell.exe -ExecutionPolicy Bypass -File $INSTALL_SCRIPT @installArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "[SUCCESS] Dependencies installed successfully!" -ForegroundColor Green
            
            # Create marker file
            New-Item -ItemType File -Path $DEPENDENCY_MARKER -Force | Out-Null
            
            Write-Host ""
            Write-Host "IMPORTANT: Reloading environment..." -ForegroundColor Yellow
            Write-Host ""
            
            # Refresh environment variables in current session
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        } else {
            Write-Host ""
            Write-Host "[ERROR] Dependency installation failed!" -ForegroundColor Red
            Write-Host "[INFO] You can try running manually: .\install_dependencies.ps1" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Continuing anyway, some features may not work..." -ForegroundColor Yellow
            Write-Host ""
            Start-Sleep -Seconds 3
        }
    } else {
        Write-Host "[ERROR] Installation script not found: $INSTALL_SCRIPT" -ForegroundColor Red
        Write-Host "Continuing anyway, some features may not work..." -ForegroundColor Yellow
        Write-Host ""
    }
}

# Start the backend
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Starting Backend Server..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment exists
$VENV_DIR = Join-Path $SCRIPT_DIR "venv"
$VENV_ACTIVATE = Join-Path $VENV_DIR "Scripts\Activate.ps1"

if (Test-Path $VENV_ACTIVATE) {
    Write-Host "[INFO] Activating virtual environment..." -ForegroundColor Cyan
    & $VENV_ACTIVATE
}

# Check if Python is available
try {
    $pythonVersion = & python --version 2>&1
    Write-Host "[INFO] Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Python not found! Please install Python 3.8+" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Install Python requirements if requirements.txt exists
$REQUIREMENTS_FILE = Join-Path $SCRIPT_DIR "requirements.txt"
if (Test-Path $REQUIREMENTS_FILE) {
    Write-Host "[INFO] Checking Python packages..." -ForegroundColor Cyan
    
    try {
        # Quick check if main packages are installed
        $checkScript = "import fastapi, uvicorn, pytesseract"
        $null = & python -c $checkScript 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[INFO] Installing Python packages from requirements.txt..." -ForegroundColor Cyan
            & python -m pip install -r $REQUIREMENTS_FILE --quiet
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[SUCCESS] Python packages installed" -ForegroundColor Green
            } else {
                Write-Host "[WARNING] Some Python packages may have failed to install" -ForegroundColor Yellow
            }
        } else {
            Write-Host "[INFO] Python packages already installed" -ForegroundColor Green
        }
    } catch {
        Write-Host "[WARNING] Could not verify Python packages: $_" -ForegroundColor Yellow
    }
}

# Run the backend
Write-Host ""
Write-Host "Starting server on http://127.0.0.1:8001" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Check if main.py or app/main.py exists
$MAIN_PY = Join-Path $SCRIPT_DIR "app\main.py"
if (-not (Test-Path $MAIN_PY)) {
    $MAIN_PY = Join-Path $SCRIPT_DIR "main.py"
}

if (Test-Path $MAIN_PY) {
    # Start uvicorn server
    & python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
} else {
    Write-Host "[ERROR] main.py not found!" -ForegroundColor Red
    Write-Host "Expected location: $MAIN_PY" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
