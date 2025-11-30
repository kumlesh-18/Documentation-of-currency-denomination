# Simplified OCR Dependencies Installation Guide
# This script checks for dependencies and provides installation guidance

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "OCR Dependencies Checker & Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allInstalled = $true

# Create OCR dependencies directory
$ocrDir = Join-Path $PSScriptRoot "ocr_dependencies"
if (-not (Test-Path $ocrDir)) {
    New-Item -ItemType Directory -Path $ocrDir | Out-Null
}

# Check Tesseract
Write-Host "[1/3] Checking Tesseract OCR..." -ForegroundColor Yellow
try {
    $tesseractTest = tesseract --version 2>&1 | Select-Object -First 1
    Write-Host "  [OK] Tesseract found: $tesseractTest" -ForegroundColor Green
} catch {
    Write-Host "  [NOT FOUND] Tesseract is not installed" -ForegroundColor Red
    Write-Host "  Download from: https://github.com/UB-Mannheim/tesseract/wiki" -ForegroundColor Yellow
    Write-Host "  Or use: choco install tesseract" -ForegroundColor Gray
    $allInstalled = $false
}

Write-Host ""

# Check Poppler
Write-Host "[2/3] Checking Poppler (PDF tools)..." -ForegroundColor Yellow
try {
    $popplerTest = pdftoppm -v 2>&1
    Write-Host "  [OK] Poppler found" -ForegroundColor Green
} catch {
    Write-Host "  [NOT FOUND] Poppler is not installed" -ForegroundColor Red
    Write-Host "  Installing Poppler locally..." -ForegroundColor Cyan
    
    try {
        $popplerUrl = "https://github.com/oschwartz10612/poppler-windows/releases/download/v23.11.0-0/Release-23.11.0-0.zip"
        $popplerZip = Join-Path $ocrDir "poppler.zip"
        $popplerExtract = Join-Path $ocrDir "poppler"
        
        if (-not (Test-Path $popplerExtract)) {
            Write-Host "  Downloading Poppler..." -ForegroundColor Cyan
            Invoke-WebRequest -Uri $popplerUrl -OutFile $popplerZip -UseBasicParsing
            
            Write-Host "  Extracting..." -ForegroundColor Cyan
            Expand-Archive -Path $popplerZip -DestinationPath $popplerExtract -Force
            Remove-Item $popplerZip -Force
            
            $popplerBin = Get-ChildItem -Path $popplerExtract -Filter "bin" -Recurse -Directory | Select-Object -First 1
            if ($popplerBin) {
                $env:PATH += ";$($popplerBin.FullName)"
                Write-Host "  [OK] Poppler installed to: $($popplerBin.FullName)" -ForegroundColor Green
                Write-Host "  Add to PATH permanently: $($popplerBin.FullName)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  [OK] Poppler found in ocr_dependencies" -ForegroundColor Green
            $popplerBin = Get-ChildItem -Path $popplerExtract -Filter "bin" -Recurse -Directory | Select-Object -First 1
            if ($popplerBin) {
                $env:PATH += ";$($popplerBin.FullName)"
            }
        }
    } catch {
        Write-Host "  [FAIL] Could not install Poppler: $_" -ForegroundColor Red
        $allInstalled = $false
    }
}

Write-Host ""

# Check and install Python packages
Write-Host "[3/3] Checking Python OCR packages..." -ForegroundColor Yellow

# Find Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "  Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  [FAIL] Python not found. Please install Python first." -ForegroundColor Red
    $allInstalled = $false
    exit 1
}

# Check for venv
$venvPath = Join-Path $PSScriptRoot "venv"
if (Test-Path $venvPath) {
    Write-Host "  Virtual environment found" -ForegroundColor Green
    
    # Activate venv
    $activateScript = Join-Path $venvPath "Scripts\Activate.ps1"
    if (Test-Path $activateScript) {
        Write-Host "  Activating venv..." -ForegroundColor Cyan
        & $activateScript
    }
} else {
    Write-Host "  No virtual environment found. Using global Python." -ForegroundColor Yellow
}

# Packages to check/install
$packages = @(
    "pytesseract",
    "Pillow",
    "PyMuPDF",
    "pdf2image",
    "python-docx",
    "opencv-python"
)

Write-Host ""
Write-Host "  Checking/Installing Python packages..." -ForegroundColor Cyan

foreach ($package in $packages) {
    Write-Host "    $package... " -NoNewline
    $checkImport = switch ($package) {
        "pytesseract" { "pytesseract" }
        "Pillow" { "PIL" }
        "PyMuPDF" { "fitz" }
        "pdf2image" { "pdf2image" }
        "python-docx" { "docx" }
        "opencv-python" { "cv2" }
    }
    
    $installed = python -c "import $checkImport" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK]" -ForegroundColor Green
    } else {
        Write-Host "[INSTALLING]" -ForegroundColor Yellow
        pip install $package --quiet --disable-pip-version-check 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "      [OK] Installed successfully" -ForegroundColor Green
        } else {
            Write-Host "      [FAIL] Installation failed" -ForegroundColor Red
            $allInstalled = $false
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($allInstalled) {
    Write-Host "[SUCCESS] All OCR dependencies are ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now:" -ForegroundColor Cyan
    Write-Host "  - Upload images (JPG, PNG, TIFF, BMP)" -ForegroundColor Gray
    Write-Host "  - Upload PDFs (text-based or scanned)" -ForegroundColor Gray
    Write-Host "  - Upload Word documents (.docx)" -ForegroundColor Gray
    Write-Host "  - Upload CSV files (as before)" -ForegroundColor Gray
    Write-Host ""
    
    # Create marker
    $markerFile = Join-Path $ocrDir ".ocr_installed"
    "OCR dependencies installed on $(Get-Date)" | Out-File $markerFile
} else {
    Write-Host "[INCOMPLETE] Some dependencies are missing" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Manual Installation Links:" -ForegroundColor Cyan
    Write-Host "  Tesseract: https://github.com/UB-Mannheim/tesseract/wiki" -ForegroundColor Gray
    Write-Host "  Poppler: https://github.com/oschwartz10612/poppler-windows/releases" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "Installation check complete." -ForegroundColor Gray
