# Documentation Website Startup Script
# Ensures all dependencies are installed and starts the server

$ErrorActionPreference = "Stop"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Documentation Website Launcher" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Change to documentation-website directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$docsPath = Join-Path $scriptPath "documentation-website"

if (-Not (Test-Path $docsPath)) {
    Write-Host "❌ Error: documentation-website folder not found!" -ForegroundColor Red
    Write-Host "   Expected path: $docsPath" -ForegroundColor Yellow
    exit 1
}

Set-Location $docsPath
Write-Host "📁 Working directory: $docsPath" -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
Write-Host "🔍 Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor Red
    Write-Host "   Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Check if package.json exists
if (-Not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found!" -ForegroundColor Red
    exit 1
}

# Check if node_modules exists
if (-Not (Test-Path "node_modules")) {
    Write-Host "📦 Dependencies not found. Installing..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
}
else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

Write-Host ""

# Check if .env exists
if (-Not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found! Creating from .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ Created .env file" -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️  IMPORTANT: Please edit .env and set:" -ForegroundColor Yellow
        Write-Host "   - SESSION_SECRET (random 32+ character string)" -ForegroundColor Yellow
        Write-Host "   - PASSWORD_HASH (generate new password hash)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   To generate password hash, run:" -ForegroundColor Cyan
        Write-Host "   node -e `"const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('your-password', 10));`"" -ForegroundColor Cyan
        Write-Host ""
        
        $response = Read-Host "Continue with default settings? (y/n)"
        if ($response -ne "y") {
            Write-Host "⏸️  Exiting. Please configure .env and run this script again." -ForegroundColor Yellow
            exit 0
        }
    }
    else {
        Write-Host "❌ .env.example not found!" -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "✅ .env file exists" -ForegroundColor Green
}

Write-Host ""

# Display security warning
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host "  🔒 SECURITY NOTICE" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host "Default Password: admin123" -ForegroundColor Red
Write-Host ""
Write-Host "⚠️  CHANGE THIS PASSWORD IMMEDIATELY!" -ForegroundColor Red
Write-Host "   Edit .env and update PASSWORD_HASH" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host ""

# Ask which mode to run
Write-Host "Select mode:" -ForegroundColor Cyan
Write-Host "  1) Development (with auto-reload)" -ForegroundColor White
Write-Host "  2) Production" -ForegroundColor White
Write-Host ""
$mode = Read-Host "Enter choice (1 or 2)"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  🚀 Starting Server..." -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

if ($mode -eq "1") {
    Write-Host "Starting in DEVELOPMENT mode..." -ForegroundColor Green
    Write-Host "Server will auto-restart on file changes" -ForegroundColor Gray
    Write-Host ""
    npm run dev
}
elseif ($mode -eq "2") {
    Write-Host "Starting in PRODUCTION mode..." -ForegroundColor Green
    Write-Host ""
    npm start
}
else {
    Write-Host "Invalid choice. Starting in development mode..." -ForegroundColor Yellow
    Write-Host ""
    npm run dev
}

# This will only execute if server stops
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Server Stopped" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
