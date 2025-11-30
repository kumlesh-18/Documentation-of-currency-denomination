# Automatic Dependency Installer for OCR-Enabled Currency Distribution Backend
# This script installs Tesseract OCR, Poppler, and Python packages automatically

param(
    [switch]$Force,
    [switch]$Silent
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Configuration
$INSTALL_DIR = "$env:LOCALAPPDATA\CurrencyDistributor"
$TESSERACT_DIR = "$INSTALL_DIR\Tesseract-OCR"
$POPPLER_DIR = "$INSTALL_DIR\poppler"
$INSTALL_LOG = "$INSTALL_DIR\install.log"

# URLs for downloads - using stable, verified versions
$TESSERACT_URL = "https://digi.bib.uni-mannheim.de/tesseract/tesseract-ocr-w64-setup-5.4.0.20240606.exe"
$POPPLER_URL = "https://github.com/oschwartz10612/poppler-windows/releases/download/v24.08.0-0/Release-24.08.0-0.zip"

# Color output functions
function Write-Info {
    param($Message)
    if (-not $Silent) {
        Write-Host "[INFO] $Message" -ForegroundColor Cyan
    }
    Add-Content -Path $INSTALL_LOG -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [INFO] $Message" -ErrorAction SilentlyContinue
}

function Write-Success {
    param($Message)
    if (-not $Silent) {
        Write-Host "[SUCCESS] $Message" -ForegroundColor Green
    }
    Add-Content -Path $INSTALL_LOG -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [SUCCESS] $Message" -ErrorAction SilentlyContinue
}

function Write-Warning {
    param($Message)
    if (-not $Silent) {
        Write-Host "[WARNING] $Message" -ForegroundColor Yellow
    }
    Add-Content -Path $INSTALL_LOG -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [WARNING] $Message" -ErrorAction SilentlyContinue
}

function Write-Error-Log {
    param($Message)
    if (-not $Silent) {
        Write-Host "[ERROR] $Message" -ForegroundColor Red
    }
    Add-Content -Path $INSTALL_LOG -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [ERROR] $Message" -ErrorAction SilentlyContinue
}

# Create installation directory
function Initialize-InstallDirectory {
    if (-not (Test-Path $INSTALL_DIR)) {
        New-Item -ItemType Directory -Path $INSTALL_DIR -Force | Out-Null
        Write-Info "Created installation directory: $INSTALL_DIR"
    }
}

# Check if Tesseract is installed
function Test-TesseractInstalled {
    # Check common locations
    $tesseractPaths = @(
        "$TESSERACT_DIR\tesseract.exe",
        "C:\Program Files\Tesseract-OCR\tesseract.exe",
        "C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"
    )
    
    foreach ($path in $tesseractPaths) {
        if (Test-Path $path) {
            Write-Info "Tesseract found at: $path"
            return $path
        }
    }
    
    # Check if in PATH
    try {
        $null = & tesseract --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Info "Tesseract found in PATH"
            return "tesseract"
        }
    } catch {}
    
    return $null
}

# Check if Poppler is installed
function Test-PopplerInstalled {
    $popplerPaths = @(
        "$POPPLER_DIR\Library\bin\pdftoppm.exe",
        "C:\Program Files\poppler\Library\bin\pdftoppm.exe"
    )
    
    foreach ($path in $popplerPaths) {
        if (Test-Path $path) {
            Write-Info "Poppler found at: $path"
            return $path
        }
    }
    
    # Check if in PATH
    try {
        $null = & pdftoppm -v 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Info "Poppler found in PATH"
            return "pdftoppm"
        }
    } catch {}
    
    return $null
}

# Download file with progress
function Download-File {
    param(
        [string]$Url,
        [string]$OutputPath
    )
    
    try {
        Write-Info "Downloading from: $Url"
        Write-Info "Saving to: $OutputPath"
        
        # Create directory if it doesn't exist
        $outputDir = Split-Path $OutputPath -Parent
        if (-not (Test-Path $outputDir)) {
            New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
        }
        
        # Use Invoke-WebRequest with proper headers to avoid 403 errors
        $ProgressPreference = 'Continue'
        
        try {
            # Create headers to mimic a browser request
            $headers = @{
                'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                'Accept' = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                'Accept-Language' = 'en-US,en;q=0.5'
                'Accept-Encoding' = 'gzip, deflate, br'
                'DNT' = '1'
                'Connection' = 'keep-alive'
                'Upgrade-Insecure-Requests' = '1'
            }
            
            Write-Info "Starting download (this may take a few minutes)..."
            Invoke-WebRequest -Uri $Url -OutFile $OutputPath -Headers $headers -TimeoutSec 600 -MaximumRedirection 5
            
            if (Test-Path $OutputPath) {
                $fileSize = (Get-Item $OutputPath).Length / 1MB
                Write-Success "Downloaded successfully ($('{0:N2}' -f $fileSize) MB)"
                return $true
            } else {
                Write-Error-Log "Download completed but file not found at: $OutputPath"
                return $false
            }
        } catch {
            Write-Warning "Invoke-WebRequest failed: $($_.Exception.Message)"
            Write-Info "Trying alternative download method..."
            
            # Fallback to WebClient with headers
            try {
                $webClient = New-Object System.Net.WebClient
                $webClient.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                $webClient.Headers.Add("Accept", "*/*")
                
                $webClient.DownloadFile($Url, $OutputPath)
                
                if (Test-Path $OutputPath) {
                    $fileSize = (Get-Item $OutputPath).Length / 1MB
                    Write-Success "Downloaded successfully ($('{0:N2}' -f $fileSize) MB)"
                    return $true
                } else {
                    Write-Error-Log "Download completed but file not found"
                    return $false
                }
            } catch {
                Write-Error-Log "Alternative download method also failed: $($_.Exception.Message)"
                throw
            }
        }
        
    } catch {
        Write-Error-Log "Failed to download from $Url"
        Write-Error-Log "Error: $($_.Exception.Message)"
        
        # Provide helpful error message based on error type
        if ($_.Exception.Message -match "403|Forbidden") {
            Write-Error-Log "Access forbidden - the server is blocking automated downloads"
            Write-Info "Please download manually from: $Url"
            Write-Info "Save to: $OutputPath"
        } elseif ($_.Exception.Message -match "404|Not Found") {
            Write-Error-Log "File not found - URL may be incorrect or file no longer available"
        } elseif ($_.Exception.Message -match "timeout|timed out") {
            Write-Error-Log "Download timed out - please check your internet connection"
        }
        
        return $false
    } finally {
        $ProgressPreference = 'SilentlyContinue'
    }
}

# Install Tesseract
function Install-Tesseract {
    Write-Info "Installing Tesseract OCR..."
    
    $installerPath = "$env:TEMP\tesseract-installer.exe"
    
    # Remove old installer if exists
    if (Test-Path $installerPath) {
        Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
    }
    
    # Download Tesseract installer
    Write-Info "Downloading Tesseract installer (this may take a few minutes)..."
    if (-not (Download-File -Url $TESSERACT_URL -OutputPath $installerPath)) {
        Write-Error-Log "Failed to download Tesseract installer"
        return $false
    }
    
    # Verify download
    if (-not (Test-Path $installerPath)) {
        Write-Error-Log "Installer file not found after download: $installerPath"
        return $false
    }
    
    $installerSize = (Get-Item $installerPath).Length / 1MB
    Write-Info "Installer downloaded: $('{0:N2}' -f $installerSize) MB"
    
    # Install silently
    try {
        Write-Info "Running Tesseract installer (silent mode)..."
        Write-Info "Installation directory: $TESSERACT_DIR"
        
        $installArgs = @(
            "/S",  # Silent install
            "/D=$TESSERACT_DIR"  # Installation directory
        )
        
        $process = Start-Process -FilePath $installerPath -ArgumentList $installArgs -Wait -PassThru -NoNewWindow
        
        Write-Info "Installer exited with code: $($process.ExitCode)"
        
        # Check if installation succeeded
        $tesseractExe = "$TESSERACT_DIR\tesseract.exe"
        if (Test-Path $tesseractExe) {
            Write-Success "Tesseract installed successfully at: $TESSERACT_DIR"
            
            # Clean up installer
            Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
            
            # Add to PATH
            Add-ToPath -Path $TESSERACT_DIR
            
            return $true
        } else {
            Write-Error-Log "Tesseract installation completed but tesseract.exe not found at: $tesseractExe"
            Write-Error-Log "Installation may have failed or used a different directory"
            return $false
        }
    } catch {
        Write-Error-Log "Failed to install Tesseract: $_"
        Write-Error-Log "Exception details: $($_.Exception.Message)"
        return $false
    }
}

# Install Poppler
function Install-Poppler {
    Write-Info "Installing Poppler..."
    
    $zipPath = "$env:TEMP\poppler.zip"
    
    # Remove old zip if exists
    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
    }
    
    # Download Poppler
    Write-Info "Downloading Poppler (this may take a few minutes)..."
    if (-not (Download-File -Url $POPPLER_URL -OutputPath $zipPath)) {
        Write-Error-Log "Failed to download Poppler"
        return $false
    }
    
    # Verify download
    if (-not (Test-Path $zipPath)) {
        Write-Error-Log "Poppler zip file not found after download: $zipPath"
        return $false
    }
    
    $zipSize = (Get-Item $zipPath).Length / 1MB
    Write-Info "Poppler downloaded: $('{0:N2}' -f $zipSize) MB"
    
    # Extract
    try {
        Write-Info "Extracting Poppler to: $POPPLER_DIR"
        
        # Create Poppler directory
        if (Test-Path $POPPLER_DIR) {
            Write-Info "Removing existing Poppler installation..."
            Remove-Item $POPPLER_DIR -Recurse -Force -ErrorAction Stop
        }
        New-Item -ItemType Directory -Path $POPPLER_DIR -Force | Out-Null
        
        # Extract using built-in .NET
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $POPPLER_DIR)
        
        Write-Success "Poppler extracted successfully"
        
        # Clean up
        Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
        
        # Add to PATH - search for bin directory dynamically
        $binDirs = Get-ChildItem -Path $POPPLER_DIR -Recurse -Directory -Filter "bin" -ErrorAction SilentlyContinue
        
        $foundBin = $false
        foreach ($binDir in $binDirs) {
            if (Test-Path "$($binDir.FullName)\pdftoppm.exe") {
                Add-ToPath -Path $binDir.FullName
                Write-Success "Found Poppler bin at: $($binDir.FullName)"
                $foundBin = $true
                break
            }
        }
        
        if (-not $foundBin) {
            Write-Warning "Could not find Poppler bin directory with pdftoppm.exe"
            Write-Warning "You may need to manually add Poppler to PATH"
            return $false
        }
        
        return $true
    } catch {
        Write-Error-Log "Failed to extract Poppler: $_"
        Write-Error-Log "Exception details: $($_.Exception.Message)"
        return $false
    }
}

# Add directory to PATH
function Add-ToPath {
    param([string]$Path)
    
    if (-not (Test-Path $Path)) {
        Write-Warning "Path does not exist: $Path"
        return
    }
    
    # Add to current session
    $env:PATH = "$Path;$env:PATH"
    
    # Add to user PATH permanently
    try {
        $currentPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)
        if ($currentPath -notlike "*$Path*") {
            [Environment]::SetEnvironmentVariable(
                "Path",
                "$currentPath;$Path",
                [EnvironmentVariableTarget]::User
            )
            Write-Success "Added to PATH: $Path"
        }
    } catch {
        Write-Warning "Could not add to permanent PATH: $_"
    }
}

# Install Python packages
function Install-PythonPackages {
    Write-Info "Installing Python packages..."
    
    $packages = @(
        "pytesseract>=0.3.10",
        "pillow>=10.0.0",
        "pdf2image>=1.16.0",
        "PyPDF2>=3.0.0",
        "python-docx>=1.1.0",
        "opencv-python>=4.8.0",
        "numpy>=1.24.0"
    )
    
    try {
        # Check if Python is available
        try {
            $pythonVersion = & python --version 2>&1
            Write-Info "Python found: $pythonVersion"
        } catch {
            Write-Error-Log "Python is not installed or not in PATH"
            Write-Error-Log "Please install Python 3.8+ from https://www.python.org/"
            return $false
        }
        
        # Check if pip is available
        try {
            $pipVersion = & python -m pip --version 2>&1
            Write-Info "pip found: $pipVersion"
        } catch {
            Write-Error-Log "Python pip is not available"
            Write-Error-Log "Please ensure pip is installed with Python"
            return $false
        }
        
        Write-Info "Installing packages: $($packages -join ', ')"
        Write-Info "This may take several minutes..."
        
        # Upgrade pip first
        Write-Info "Upgrading pip..."
        & python -m pip install --upgrade pip --quiet 2>&1 | Out-Null
        
        # Install packages one by one for better error handling
        $failed = @()
        $success = @()
        
        foreach ($package in $packages) {
            $packageName = $package -replace '>=.*', ''
            Write-Info "Installing $packageName..."
            
            try {
                # Use --only-binary for packages that might need compilation
                if ($package -match "numpy|opencv-python") {
                    $output = & python -m pip install --only-binary :all: $package 2>&1
                } else {
                    $output = & python -m pip install $package 2>&1
                }
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Success "✓ Installed $packageName"
                    $success += $packageName
                } else {
                    Write-Warning "✗ Failed to install $packageName"
                    Write-Warning "Output: $($output | Out-String)"
                    $failed += $packageName
                }
            } catch {
                Write-Warning "✗ Exception installing $packageName : $_"
                $failed += $packageName
            }
        }
        
        Write-Info ""
        Write-Info "Installation summary:"
        Write-Success "Successful: $($success.Count)/$($packages.Count) packages"
        if ($success.Count -gt 0) {
            $success | ForEach-Object { Write-Success "  ✓ $_" }
        }
        
        if ($failed.Count -gt 0) {
            Write-Warning "Failed: $($failed.Count) packages"
            $failed | ForEach-Object { Write-Warning "  ✗ $_" }
            Write-Warning "Some packages failed, but OCR may still work"
        }
        
        # Return success if at least core packages are installed
        $corePackages = @('pytesseract', 'pillow', 'pdf2image')
        $coreInstalled = $true
        foreach ($core in $corePackages) {
            if ($failed -contains $core) {
                $coreInstalled = $false
                break
            }
        }
        
        if ($coreInstalled) {
            Write-Success "Core OCR packages installed successfully"
            return $true
        } else {
            Write-Error-Log "Core OCR packages failed to install"
            return $false
        }
        
    } catch {
        Write-Error-Log "Failed to install Python packages: $_"
        Write-Error-Log "Exception details: $($_.Exception.Message)"
        return $false
    }
}

# Verify installations
function Test-AllDependencies {
    Write-Info "Verifying installations..."
    
    $allGood = $true
    
    # Test Tesseract
    try {
        $tesseractPath = Test-TesseractInstalled
        if ($tesseractPath) {
            if ($tesseractPath -eq "tesseract") {
                $version = & tesseract --version 2>&1 | Select-Object -First 1
            } else {
                $version = & $tesseractPath --version 2>&1 | Select-Object -First 1
            }
            Write-Success "Tesseract: $version"
        } else {
            Write-Error-Log "Tesseract not found"
            $allGood = $false
        }
    } catch {
        Write-Error-Log "Tesseract verification failed: $_"
        $allGood = $false
    }
    
    # Test Poppler
    try {
        $popplerPath = Test-PopplerInstalled
        if ($popplerPath) {
            if ($popplerPath -eq "pdftoppm") {
                $version = & pdftoppm -v 2>&1 | Select-Object -First 1
            } else {
                $version = & $popplerPath -v 2>&1 | Select-Object -First 1
            }
            Write-Success "Poppler: $version"
        } else {
            Write-Error-Log "Poppler not found"
            $allGood = $false
        }
    } catch {
        Write-Error-Log "Poppler verification failed: $_"
        $allGood = $false
    }
    
    # Test Python packages
    try {
        $testScript = @"
import sys
packages = ['pytesseract', 'PIL', 'pdf2image', 'PyPDF2', 'docx', 'cv2', 'numpy']
missing = []
for pkg in packages:
    try:
        __import__(pkg)
        print(f'✓ {pkg}')
    except ImportError:
        missing.append(pkg)
        print(f'✗ {pkg}')
        sys.exit(1)
"@
        
        $result = & python -c $testScript 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "All Python packages verified"
            $result | ForEach-Object { Write-Info $_ }
        } else {
            Write-Error-Log "Some Python packages are missing"
            $result | ForEach-Object { Write-Warning $_ }
            $allGood = $false
        }
    } catch {
        Write-Error-Log "Python package verification failed: $_"
        $allGood = $false
    }
    
    return $allGood
}

# Main installation flow
function Start-Installation {
    Write-Info "==================================================="
    Write-Info "Currency Distributor - Dependency Installer"
    Write-Info "==================================================="
    Write-Info ""
    
    Initialize-InstallDirectory
    
    $needsInstall = $false
    
    # Check Tesseract
    if ($Force -or -not (Test-TesseractInstalled)) {
        Write-Info "Tesseract OCR not found, will install..."
        $needsInstall = $true
        
        if (-not (Install-Tesseract)) {
            Write-Error-Log "Failed to install Tesseract"
            return $false
        }
    } else {
        Write-Success "Tesseract OCR already installed"
    }
    
    # Check Poppler
    if ($Force -or -not (Test-PopplerInstalled)) {
        Write-Info "Poppler not found, will install..."
        $needsInstall = $true
        
        if (-not (Install-Poppler)) {
            Write-Error-Log "Failed to install Poppler"
            return $false
        }
    } else {
        Write-Success "Poppler already installed"
    }
    
    # Install Python packages
    Write-Info ""
    if (-not (Install-PythonPackages)) {
        Write-Warning "Some Python packages failed to install, but continuing..."
    }
    
    # Verify everything
    Write-Info ""
    Write-Info "==================================================="
    Write-Info "Verification"
    Write-Info "==================================================="
    
    if (Test-AllDependencies) {
        Write-Info ""
        Write-Success "==================================================="
        Write-Success "All dependencies installed and verified!"
        Write-Success "==================================================="
        Write-Info ""
        Write-Info "Installation log: $INSTALL_LOG"
        Write-Info ""
        
        if ($needsInstall) {
            Write-Warning "IMPORTANT: Please restart your terminal/PowerShell"
            Write-Warning "to ensure PATH changes take effect."
        }
        
        return $true
    } else {
        Write-Info ""
        Write-Error-Log "==================================================="
        Write-Error-Log "Some dependencies failed verification"
        Write-Error-Log "==================================================="
        Write-Info ""
        Write-Info "Check installation log: $INSTALL_LOG"
        return $false
    }
}

# Run installation
$success = Start-Installation

# Exit with appropriate code
if ($success) {
    exit 0
} else {
    exit 1
}
