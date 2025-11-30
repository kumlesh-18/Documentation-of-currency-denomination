##############################################################################
# Build Portable Documentation Package
# This script creates a self-contained portable version with embedded Node.js
##############################################################################

param(
    [string]$OutputDir = "PORTABLE_DOCUMENTATION",
    [string]$NodeVersion = "20.10.0"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Building Portable Documentation Package" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PortableDir = Join-Path $ScriptDir $OutputDir

Write-Host "[1/7] Setting up directories..." -ForegroundColor Yellow

# Create directory structure
$AppDir = Join-Path $PortableDir "app"
$RuntimeDir = Join-Path $PortableDir "runtime"
$NodeDir = Join-Path $RuntimeDir "node"

if (Test-Path $AppDir) {
    Write-Host "  - Cleaning existing app directory..." -ForegroundColor Gray
    Remove-Item $AppDir -Recurse -Force
}

New-Item -ItemType Directory -Path $AppDir -Force | Out-Null
New-Item -ItemType Directory -Path $RuntimeDir -Force | Out-Null

Write-Host "  Done: Directories created" -ForegroundColor Green

# Copy application files
Write-Host ""
Write-Host "[2/7] Copying application files..." -ForegroundColor Yellow

$SourceDir = Join-Path $ScriptDir "documentation-website"

# Copy essential files
Write-Host "  - Copying server files..." -ForegroundColor Gray
Copy-Item "$SourceDir\server" -Destination $AppDir -Recurse -Force

Write-Host "  - Copying public files..." -ForegroundColor Gray
Copy-Item "$SourceDir\public" -Destination $AppDir -Recurse -Force

Write-Host "  - Copying configuration files..." -ForegroundColor Gray
Copy-Item "$SourceDir\package.json" -Destination $AppDir -Force
Copy-Item "$SourceDir\.env" -Destination $AppDir -Force

Write-Host "  Done: Application files copied" -ForegroundColor Green

# Download and extract Node.js portable
Write-Host ""
Write-Host "[3/7] Downloading Node.js portable runtime..." -ForegroundColor Yellow

if (-not (Test-Path $NodeDir)) {
    $NodeUrl = "https://nodejs.org/dist/v$NodeVersion/node-v$NodeVersion-win-x64.zip"
    $NodeZip = Join-Path $env:TEMP "node-portable.zip"
    
    Write-Host "  - Downloading Node.js v$NodeVersion..." -ForegroundColor Gray
    Write-Host "    URL: $NodeUrl" -ForegroundColor Gray
    
    try {
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $NodeUrl -OutFile $NodeZip -UseBasicParsing
        $ProgressPreference = 'Continue'
        
        Write-Host "  - Extracting Node.js runtime..." -ForegroundColor Gray
        Expand-Archive -Path $NodeZip -DestinationPath $RuntimeDir -Force
        
        # Rename extracted folder to 'node'
        $ExtractedFolder = Get-ChildItem $RuntimeDir -Directory | Where-Object { $_.Name -like "node-v*" }
        if ($ExtractedFolder) {
            Rename-Item $ExtractedFolder.FullName -NewName "node" -Force
        }
        
        Remove-Item $NodeZip -Force
        Write-Host "  Done: Node.js runtime installed" -ForegroundColor Green
        
    } catch {
        Write-Host "  ERROR: Failed to download Node.js: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "MANUAL INSTALLATION REQUIRED:" -ForegroundColor Yellow
        Write-Host "1. Download Node.js portable from: $NodeUrl" -ForegroundColor White
        Write-Host "2. Extract to: $NodeDir" -ForegroundColor White
        Write-Host "3. Ensure node.exe exists at: $NodeDir\node.exe" -ForegroundColor White
        Write-Host ""
        Read-Host "Press Enter after manual installation to continue, or Ctrl+C to abort"
    }
} else {
    Write-Host "  Done: Node.js runtime already exists" -ForegroundColor Green
}

# Install dependencies
Write-Host ""
Write-Host "[4/7] Installing dependencies..." -ForegroundColor Yellow

$NodeExe = Join-Path $NodeDir "node.exe"
$NpmCmd = Join-Path $NodeDir "npm.cmd"

if (Test-Path $NodeExe) {
    $env:PATH = "$NodeDir;$env:PATH"
    
    Write-Host "  - Running npm install (production)..." -ForegroundColor Gray
    Push-Location $AppDir
    
    try {
        & $NpmCmd install --production --no-audit --no-fund 2>&1 | Out-Null
        Write-Host "  Done: Dependencies installed" -ForegroundColor Green
    } catch {
        Write-Host "  Warning: npm install may have had issues" -ForegroundColor Yellow
        Write-Host "    Error: $_" -ForegroundColor Gray
    }
    
    Pop-Location
} else {
    Write-Host "  ERROR: Node.js executable not found at: $NodeExe" -ForegroundColor Red
    exit 1
}

# Remove unnecessary files
Write-Host ""
Write-Host "[5/7] Cleaning up unnecessary files..." -ForegroundColor Yellow

$CleanupPaths = @(
    "$AppDir\.git",
    "$AppDir\.gitignore",
    "$AppDir\netlify.toml",
    "$AppDir\vercel.json",
    "$AppDir\README.md",
    "$AppDir\node_modules\.package-lock.json",
    "$AppDir\node_modules\.bin"
)

foreach ($path in $CleanupPaths) {
    if (Test-Path $path) {
        Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  - Removed: $(Split-Path $path -Leaf)" -ForegroundColor Gray
    }
}

Write-Host "  Done: Cleanup complete" -ForegroundColor Green

# Update .env for portable mode
Write-Host ""
Write-Host "[6/7] Configuring for portable mode..." -ForegroundColor Yellow

$EnvFile = Join-Path $AppDir ".env"
if (Test-Path $EnvFile) {
    $envContent = Get-Content $EnvFile -Raw
    $envContent = $envContent -replace 'NODE_ENV=development', 'NODE_ENV=production'
    Set-Content $EnvFile -Value $envContent -NoNewline
    Write-Host "  Done: Environment configured for production" -ForegroundColor Green
}

# Calculate package size
Write-Host ""
Write-Host "[7/7] Generating package information..." -ForegroundColor Yellow

$TotalSize = (Get-ChildItem $PortableDir -Recurse | Measure-Object -Property Length -Sum).Sum
$TotalSizeMB = [math]::Round($TotalSize / 1MB, 2)

$AppSize = (Get-ChildItem $AppDir -Recurse | Measure-Object -Property Length -Sum).Sum
$AppSizeMB = [math]::Round($AppSize / 1MB, 2)

$RuntimeSize = (Get-ChildItem $RuntimeDir -Recurse | Measure-Object -Property Length -Sum).Sum
$RuntimeSizeMB = [math]::Round($RuntimeSize / 1MB, 2)

Write-Host "  Done: Package information generated" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " BUILD COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Package Location:" -ForegroundColor White
Write-Host "  $PortableDir" -ForegroundColor Yellow
Write-Host ""
Write-Host "Package Size:" -ForegroundColor White
Write-Host "  Total: $TotalSizeMB MB" -ForegroundColor Yellow
Write-Host "  App: $AppSizeMB MB" -ForegroundColor Gray
Write-Host "  Runtime: $RuntimeSizeMB MB" -ForegroundColor Gray
Write-Host ""
Write-Host "Launch Scripts:" -ForegroundColor White
Write-Host "  START.bat           - Start server (manual browser)" -ForegroundColor Yellow
Write-Host "  START_AND_OPEN.bat  - Start server + auto-open browser" -ForegroundColor Yellow
Write-Host ""
Write-Host "Documentation:" -ForegroundColor White
Write-Host "  README.txt          - Full instructions" -ForegroundColor Yellow
Write-Host "  CHANGELOG.txt       - Version history" -ForegroundColor Yellow
Write-Host "  LICENSE.txt         - License information" -ForegroundColor Yellow
Write-Host ""
Write-Host "Default Credentials:" -ForegroundColor White
Write-Host "  URL: http://localhost:3000" -ForegroundColor Yellow
Write-Host "  Password: currency2025" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor White
Write-Host "  1. Navigate to: $PortableDir" -ForegroundColor Green
Write-Host "  2. Double-click: START_AND_OPEN.bat" -ForegroundColor Green
Write-Host "  3. Login and browse documentation" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
