# Simple Dependency Checker and Installer
# This script checks for required dependencies and helps install them

$ErrorActionPreference = "Continue"

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "Currency Distributor - Dependency Checker" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

$allInstalled = $true

# Check Tesseract
Write-Host "[1/3] Checking Tesseract OCR..." -ForegroundColor Yellow
$tesseractFound = $false

$tesseractPaths = @(
    "C:\Program Files\Tesseract-OCR\tesseract.exe",
    "C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    "$env:LOCALAPPDATA\CurrencyDistributor\Tesseract-OCR\tesseract.exe"
)

foreach ($path in $tesseractPaths) {
    if (Test-Path $path) {
        Write-Host "  [OK] Tesseract found at: $path" -ForegroundColor Green
        $tesseractFound = $true
        
        # Add to PATH if not already there
        $tesseractDir = Split-Path $path -Parent
        if ($env:PATH -notlike "*$tesseractDir*") {
            $env:PATH += ";$tesseractDir"
            Write-Host "  [OK] Added to current session PATH" -ForegroundColor Green
        }
        break
    }
}

if (-not $tesseractFound) {
    try {
        $null = & tesseract --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] Tesseract found in PATH" -ForegroundColor Green
            $tesseractFound = $true
        }
    } catch {}
}

if (-not $tesseractFound) {
    Write-Host "  [MISSING] Tesseract NOT found" -ForegroundColor Red
    Write-Host "    Please download and install from:" -ForegroundColor Yellow
    Write-Host "    https://digi.bib.uni-mannheim.de/tesseract/tesseract-ocr-w64-setup-5.4.0.20240606.exe" -ForegroundColor Yellow
    $allInstalled = $false
}

Write-Host ""

# Check Poppler
Write-Host "[2/3] Checking Poppler..." -ForegroundColor Yellow
$popplerFound = $false

$popplerPaths = @(
    "C:\Program Files\poppler\Library\bin\pdftoppm.exe",
    "C:\Program Files\poppler\poppler-24.08.0\Library\bin\pdftoppm.exe",
    "$env:LOCALAPPDATA\CurrencyDistributor\poppler\poppler-24.08.0\Library\bin\pdftoppm.exe"
)

foreach ($path in $popplerPaths) {
    if (Test-Path $path) {
        Write-Host "  [OK] Poppler found at: $path" -ForegroundColor Green
        $popplerFound = $true
        
        # Add to PATH if not already there
        $popplerDir = Split-Path $path -Parent
        if ($env:PATH -notlike "*$popplerDir*") {
            $env:PATH += ";$popplerDir"
            Write-Host "  [OK] Added to current session PATH" -ForegroundColor Green
        }
        break
    }
}

if (-not $popplerFound) {
    try {
        $null = & pdftoppm -v 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] Poppler found in PATH" -ForegroundColor Green
            $popplerFound = $true
        }
    } catch {}
}

if (-not $popplerFound) {
    Write-Host "  [MISSING] Poppler NOT found" -ForegroundColor Red
    Write-Host "    Please download and extract from:" -ForegroundColor Yellow
    Write-Host "    https://github.com/oschwartz10612/poppler-windows/releases/download/v24.08.0-0/Release-24.08.0-0.zip" -ForegroundColor Yellow
    Write-Host "    Extract to: C:\Program Files\poppler" -ForegroundColor Yellow
    $allInstalled = $false
}

Write-Host ""

# Check Python packages
Write-Host "[3/3] Checking Python packages..." -ForegroundColor Yellow

try {
    $pythonCheck = & python --version 2>&1
    Write-Host "  [OK] Python: $pythonCheck" -ForegroundColor Green
    
    $packages = @("pytesseract", "PIL", "pdf2image", "PyPDF2", "docx", "cv2", "numpy")
    $missing = @()
    
    foreach ($pkg in $packages) {
        try {
            $result = & python -c "import $pkg; print('OK')" 2>&1
            if ($result -like "*OK*") {
                Write-Host "  [OK] $pkg" -ForegroundColor Green
            } else {
                Write-Host "  [MISSING] $pkg" -ForegroundColor Red
                $missing += $pkg
            }
        } catch {
            Write-Host "  [MISSING] $pkg" -ForegroundColor Red
            $missing += $pkg
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-Host ""
        Write-Host "  Missing packages detected. Installing..." -ForegroundColor Yellow
        
        $pkgMap = @{
            "PIL" = "pillow"
            "cv2" = "opencv-python"
            "docx" = "python-docx"
        }
        
        foreach ($pkg in $missing) {
            $installName = if ($pkgMap.ContainsKey($pkg)) { $pkgMap[$pkg] } else { $pkg }
            Write-Host "  Installing $installName..." -ForegroundColor Yellow
            
            if ($installName -match "numpy|opencv") {
                & python -m pip install --only-binary :all: $installName --quiet
            } else {
                & python -m pip install $installName --quiet
            }
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "    [OK] Installed $installName" -ForegroundColor Green
            } else {
                Write-Host "    [FAILED] Failed to install $installName" -ForegroundColor Red
                $allInstalled = $false
            }
        }
    }
    
} catch {
    Write-Host "  [MISSING] Python not found!" -ForegroundColor Red
    Write-Host "    Please install Python 3.8+ from https://www.python.org/" -ForegroundColor Yellow
    $allInstalled = $false
}

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan

if ($allInstalled) {
    Write-Host "All dependencies are installed!" -ForegroundColor Green
    Write-Host "=========================================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Create marker file
    New-Item -Path ".dependencies_installed" -ItemType File -Force | Out-Null
    
    exit 0
} else {
    Write-Host "Some dependencies are missing!" -ForegroundColor Red
    Write-Host "=========================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please install the missing components and run this script again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Quick Installation Guide:" -ForegroundColor Cyan
    Write-Host "1. Download Tesseract from the URL above and install it" -ForegroundColor White
    Write-Host "2. Download Poppler ZIP and extract to C:\Program Files\poppler" -ForegroundColor White
    Write-Host "3. Run this script again to verify and install Python packages" -ForegroundColor White
    Write-Host ""
    
    exit 1
}
