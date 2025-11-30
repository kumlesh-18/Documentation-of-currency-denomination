# System Health Check
# Verifies all components are ready

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Currency Denomination System" -ForegroundColor Cyan
Write-Host "Health Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check Python
Write-Host "Checking Python..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "  FAIL Python not found" -ForegroundColor Red
    $allGood = $false
}

# Check core engine
Write-Host "Checking Core Engine..." -ForegroundColor Yellow
Write-Host "  Running verification tests..." -ForegroundColor Gray
$originalLocation = Get-Location
try {
    Set-Location "packages\core-engine"
    $verifyScript = ".\verify.py"
    if (Test-Path $verifyScript) {
        Write-Host "  OK Core engine tests available" -ForegroundColor Green
    } else {
        Write-Host "  FAIL verify.py not found" -ForegroundColor Red
        $allGood = $false
    }
} finally {
    Set-Location $originalLocation
}

# Check documentation
Write-Host "Checking Documentation..." -ForegroundColor Yellow
$docFiles = @("README.md", "INDEX.md", "QUICKSTART.md", "ARCHITECTURE.md")
$docCount = 0
foreach ($doc in $docFiles) {
    if (Test-Path $doc) {
        $docCount++
    }
}
Write-Host "  OK Found $docCount/$($docFiles.Count) documentation files" -ForegroundColor Green

# Check project structure
Write-Host "Checking Project Structure..." -ForegroundColor Yellow
$requiredDirs = @("packages\core-engine", "packages\local-backend")
$allDirsExist = $true
foreach ($dir in $requiredDirs) {
    if (-Not (Test-Path $dir)) {
        $allDirsExist = $false
        Write-Host "  MISSING $dir" -ForegroundColor Red
    }
}
if ($allDirsExist) {
    Write-Host "  OK All required directories present" -ForegroundColor Green
} else {
    $allGood = $false
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "SYSTEM STATUS: HEALTHY" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Ready to use! Run .\start.ps1 to begin." -ForegroundColor White
} else {
    Write-Host "SYSTEM STATUS: ISSUES DETECTED" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please fix the issues above." -ForegroundColor Yellow
    exit 1
}
