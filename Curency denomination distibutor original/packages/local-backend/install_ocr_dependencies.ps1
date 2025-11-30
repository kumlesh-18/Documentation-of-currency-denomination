# OCR Dependencies Installation Script
# Installs Tesseract OCR, Poppler, and Python packages for offline OCR processing

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "OCR Dependencies Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "WARNING: Not running as Administrator. Some installations may fail." -ForegroundColor Yellow
    Write-Host "Consider running as Administrator for best results." -ForegroundColor Yellow
    Write-Host ""
}

# Create OCR dependencies directory
$ocrDir = Join-Path $PSScriptRoot "ocr_dependencies"
if (-not (Test-Path $ocrDir)) {
    New-Item -ItemType Directory -Path $ocrDir | Out-Null
}

# Check if Chocolatey is installed
Write-Host "[1/5] Checking for Chocolatey package manager..." -ForegroundColor Yellow
$chocoInstalled = $false
try {
    $chocoVersion = choco --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        $chocoInstalled = $true
        Write-Host "  [OK] Chocolatey is already installed (v$chocoVersion)" -ForegroundColor Green
    }
} catch {
    $chocoInstalled = $false
}

if (-not $chocoInstalled) {
    Write-Host "  Installing Chocolatey..." -ForegroundColor Cyan
    try {
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        
        # Refresh environment
        $env:ChocolateyInstall = Convert-Path "$((Get-Command choco).Path)\..\.."
        Import-Module "$env:ChocolateyInstall\helpers\chocolateyProfile.psm1"
        Update-SessionEnvironment
        
        Write-Host "  [OK] Chocolatey installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "  [FAIL] Failed to install Chocolatey: $_" -ForegroundColor Red
        Write-Host "  Please install manually from: https://chocolatey.org/install" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""

# Install Tesseract OCR
Write-Host "[2/5] Installing Tesseract OCR..." -ForegroundColor Yellow
$tesseractInstalled = $false
try {
    $tesseractPath = Get-Command tesseract -ErrorAction SilentlyContinue
    if ($tesseractPath) {
        $tesseractVersion = tesseract --version 2>&1 | Select-Object -First 1
        Write-Host "  [OK] Tesseract is already installed: $tesseractVersion" -ForegroundColor Green
        $tesseractInstalled = $true
    }
} catch {
    $tesseractInstalled = $false
}

if (-not $tesseractInstalled) {
    Write-Host "  Installing Tesseract via Chocolatey..." -ForegroundColor Cyan
    try {
        choco install tesseract -y --no-progress
        
        # Add Tesseract to PATH
        $tesseractPaths = @(
            "C:\Program Files\Tesseract-OCR",
            "C:\Program Files (x86)\Tesseract-OCR"
        )
        
        foreach ($path in $tesseractPaths) {
            if (Test-Path $path) {
                $currentPath = [Environment]::GetEnvironmentVariable('PATH', 'Machine')
                if ($currentPath -notlike "*$path*") {
                    [Environment]::SetEnvironmentVariable('PATH', "$currentPath;$path", 'Machine')
                    $env:PATH += ";$path"
                }
                Write-Host "  [OK] Tesseract installed successfully at $path" -ForegroundColor Green
                $tesseractInstalled = $true
                break
            }
        }
        
        if (-not $tesseractInstalled) {
            Write-Host "  [WARN] Tesseract installed but not found in expected locations" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  [FAIL] Failed to install Tesseract: $_" -ForegroundColor Red
        Write-Host "  Please install manually from: https://github.com/UB-Mannheim/tesseract/wiki" -ForegroundColor Yellow
    }
}

Write-Host ""

# Install Poppler (for PDF processing)
Write-Host "[3/5] Installing Poppler (PDF utilities)..." -ForegroundColor Yellow
$popplerInstalled = $false
try {
    $popplerPath = Get-Command pdftoppm -ErrorAction SilentlyContinue
    if ($popplerPath) {
        Write-Host "  [OK] Poppler is already installed" -ForegroundColor Green
        $popplerInstalled = $true
    }
} catch {
    $popplerInstalled = $false
}

if (-not $popplerInstalled) {
    Write-Host "  Downloading Poppler for Windows..." -ForegroundColor Cyan
    try {
        # Download Poppler
        $popplerUrl = "https://github.com/oschwartz10612/poppler-windows/releases/download/v23.11.0-0/Release-23.11.0-0.zip"
        $popplerZip = Join-Path $ocrDir "poppler.zip"
        $popplerExtract = Join-Path $ocrDir "poppler"
        
        Write-Host "  Downloading from GitHub..." -ForegroundColor Cyan
        Invoke-WebRequest -Uri $popplerUrl -OutFile $popplerZip -UseBasicParsing
        
        Write-Host "  Extracting Poppler..." -ForegroundColor Cyan
        Expand-Archive -Path $popplerZip -DestinationPath $popplerExtract -Force
        
        # Find bin directory
        $popplerBin = Get-ChildItem -Path $popplerExtract -Filter "bin" -Recurse -Directory | Select-Object -First 1
        
        if ($popplerBin) {
            # Add to PATH
            $currentPath = [Environment]::GetEnvironmentVariable('PATH', 'User')
            $popplerBinPath = $popplerBin.FullName
            if ($currentPath -notlike "*$popplerBinPath*") {
                [Environment]::SetEnvironmentVariable('PATH', "$currentPath;$popplerBinPath", 'User')
                $env:PATH += ";$popplerBinPath"
            }
            
            Write-Host "  [OK] Poppler installed successfully at $popplerBinPath" -ForegroundColor Green
            $popplerInstalled = $true
        } else {
            Write-Host "  [WARN] Poppler bin directory not found after extraction" -ForegroundColor Yellow
        }
        
        # Clean up
        Remove-Item $popplerZip -Force -ErrorAction SilentlyContinue
        
    } catch {
        Write-Host "  [FAIL] Failed to install Poppler: $_" -ForegroundColor Red
        Write-Host "  Please install manually from: https://github.com/oschwartz10612/poppler-windows/releases" -ForegroundColor Yellow
    }
}

Write-Host ""

# Install Python OCR packages
Write-Host "[4/5] Installing Python OCR packages..." -ForegroundColor Yellow

# Check for virtual environment
$venvPath = Join-Path $PSScriptRoot "venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "  Creating virtual environment..." -ForegroundColor Cyan
    python -m venv $venvPath
}

# Activate virtual environment
$activateScript = Join-Path $venvPath "Scripts\Activate.ps1"
if (Test-Path $activateScript) {
    & $activateScript
}

$packages = @(
    "pytesseract",
    "Pillow",
    "PyMuPDF",
    "pdf2image",
    "python-docx",
    "opencv-python"
)

Write-Host "  Installing packages: $($packages -join ', ')" -ForegroundColor Cyan
foreach ($package in $packages) {
    Write-Host "    Installing $package..." -ForegroundColor Gray
    pip install $package --quiet --disable-pip-version-check
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    [OK] $package installed" -ForegroundColor Green
    } else {
        Write-Host "    [FAIL] Failed to install $package" -ForegroundColor Red
    }
}

Write-Host ""

# Download Tesseract language data
Write-Host "[5/5] Downloading Tesseract language data..." -ForegroundColor Yellow

$tessdataDir = "C:\Program Files\Tesseract-OCR\tessdata"
if (-not (Test-Path "C:\Program Files\Tesseract-OCR")) {
    $tessdataDir = "C:\Program Files (x86)\Tesseract-OCR\tessdata"
}

if (Test-Path $tessdataDir) {
    $engDataPath = Join-Path $tessdataDir "eng.traineddata"
    
    if (-not (Test-Path $engDataPath)) {
        Write-Host "  Downloading English language data..." -ForegroundColor Cyan
        try {
            $engDataUrl = "https://github.com/tesseract-ocr/tessdata/raw/main/eng.traineddata"
            Invoke-WebRequest -Uri $engDataUrl -OutFile $engDataPath -UseBasicParsing
            Write-Host "  [OK] English language data downloaded" -ForegroundColor Green
        } catch {
            Write-Host "  [FAIL] Failed to download language data: $_" -ForegroundColor Red
            Write-Host "  OCR may not work properly without language data" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  [OK] English language data already exists" -ForegroundColor Green
    }
} else {
    Write-Host "  [WARN] Tesseract tessdata directory not found" -ForegroundColor Yellow
    Write-Host "  Language data will be downloaded automatically when needed" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installation Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Test installations
Write-Host ""
Write-Host "Testing installations..." -ForegroundColor Yellow
Write-Host ""

# Test Tesseract
Write-Host "Tesseract OCR: " -NoNewline
try {
    $tesseractTest = tesseract --version 2>&1 | Select-Object -First 1
    Write-Host "[OK] Working - $tesseractTest" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Not working" -ForegroundColor Red
}

# Test Poppler
Write-Host "Poppler (pdftoppm): " -NoNewline
try {
    $popplerTest = pdftoppm -v 2>&1 | Select-Object -First 1
    Write-Host "[OK] Working" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Not working" -ForegroundColor Red
}

# Test Python packages
Write-Host ""
Write-Host "Python Packages:" -ForegroundColor Yellow
$testResults = @()
$testResults += python -c "import pytesseract; print('  pytesseract: [OK]')" 2>&1
$testResults += python -c "import PIL; print('  Pillow: [OK]')" 2>&1
$testResults += python -c "import fitz; print('  PyMuPDF: [OK]')" 2>&1
$testResults += python -c "import pdf2image; print('  pdf2image: [OK]')" 2>&1
$testResults += python -c "import docx; print('  python-docx: [OK]')" 2>&1
$testResults += python -c "import cv2; print('  opencv-python: [OK]')" 2>&1

foreach ($result in $testResults) {
    if ($result -match '\[OK\]') {
        Write-Host $result -ForegroundColor Green
    } else {
        Write-Host $result -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installation complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The system is now ready for offline OCR processing." -ForegroundColor Green
Write-Host "All future operations will work without internet connection." -ForegroundColor Green
Write-Host ""
Write-Host "You can now upload images, PDFs, and Word documents for bulk processing." -ForegroundColor Cyan
Write-Host ""

# Create marker file
$markerFile = Join-Path $ocrDir ".ocr_installed"
"OCR dependencies installed on $(Get-Date)" | Out-File $markerFile

Write-Host "Installation script finished. You may close this window." -ForegroundColor Gray
