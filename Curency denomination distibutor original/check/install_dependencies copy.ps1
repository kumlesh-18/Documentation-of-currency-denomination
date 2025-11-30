# Fully Automatic Dependency Installer - Currency Distributor Backend
# This script downloads and installs ALL dependencies without user intervention

param(
    [switch]$Force
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Configuration
$INSTALL_DIR = "$env:LOCALAPPDATA\CurrencyDistributor"
$TESSERACT_DIR = "$INSTALL_DIR\Tesseract-OCR"
$POPPLER_DIR = "$INSTALL_DIR\poppler"
$INSTALL_LOG = "$INSTALL_DIR\install.log"
$TEMP_DIR = "$env:TEMP\CurrencyDistributor"

# Create directories
New-Item -ItemType Directory -Path $INSTALL_DIR -Force | Out-Null
New-Item -ItemType Directory -Path $TEMP_DIR -Force | Out-Null

# Logging function
function Write-Log {
    param($Message, $Color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Write-Host $logMessage -ForegroundColor $Color
    Add-Content -Path $INSTALL_LOG -Value $logMessage -ErrorAction SilentlyContinue
}

Write-Log "=========================================================" "Cyan"
Write-Log "Automatic Dependency Installer - Starting..." "Cyan"
Write-Log "=========================================================" "Cyan"

# Advanced download function with multiple fallback methods
function Download-FileAdvanced {
    param(
        [string]$Url,
        [string]$OutputPath,
        [string]$Description
    )
    
    Write-Log "Downloading $Description..." "Yellow"
    Write-Log "URL: $Url" "Gray"
    
    # Ensure output directory exists
    $outputDir = Split-Path $OutputPath -Parent
    if (-not (Test-Path $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    }
    
    # Remove existing file
    if (Test-Path $OutputPath) {
        Remove-Item $OutputPath -Force -ErrorAction SilentlyContinue
    }
    
    # Method 1: Try .NET WebClient (fastest)
    try {
        Write-Log "  Attempting .NET WebClient download..." "Gray"
        $webClient = New-Object System.Net.WebClient
        $webClient.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        $webClient.Proxy = [System.Net.WebRequest]::DefaultWebProxy
        $webClient.Proxy.Credentials = [System.Net.CredentialCache]::DefaultNetworkCredentials
        
        # Synchronous download with timeout handling
        $downloadTask = $webClient.DownloadFileTaskAsync($Url, $OutputPath)
        $timeoutTask = [System.Threading.Tasks.Task]::Delay(600000) # 10 minute timeout
        $completedTask = [System.Threading.Tasks.Task]::WaitAny(@($downloadTask, $timeoutTask))
        
        if ($completedTask -eq 0 -and (Test-Path $OutputPath)) {
            $size = [math]::Round((Get-Item $OutputPath).Length / 1MB, 2)
            Write-Log "  SUCCESS: Downloaded $size MB via WebClient" "Green"
            $webClient.Dispose()
            return $true
        } else {
            Write-Log "  WebClient timed out or failed" "Yellow"
            $webClient.Dispose()
        }
    } catch {
        Write-Log "  WebClient failed: $($_.Exception.Message)" "Yellow"
    }
    
    # Method 2: BITS Transfer (Windows Background Intelligent Transfer)
    try {
        Write-Log "  Attempting BITS Transfer..." "Gray"
        Import-Module BitsTransfer -ErrorAction Stop
        
        Start-BitsTransfer `
            -Source $Url `
            -Destination $OutputPath `
            -Priority High `
            -RetryInterval 60 `
            -RetryTimeout 300 `
            -ErrorAction Stop
        
        if (Test-Path $OutputPath) {
            $size = [math]::Round((Get-Item $OutputPath).Length / 1MB, 2)
            Write-Log "  SUCCESS: Downloaded $size MB via BITS" "Green"
            return $true
        }
    } catch {
        Write-Log "  BITS Transfer failed: $($_.Exception.Message)" "Yellow"
    }
    
    # Method 3: Invoke-WebRequest with custom headers
    try {
        Write-Log "  Attempting Invoke-WebRequest..." "Gray"
        $headers = @{
            'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            'Accept' = '*/*'
            'Accept-Encoding' = 'gzip, deflate, br'
            'Connection' = 'keep-alive'
        }
        
        Invoke-WebRequest `
            -Uri $Url `
            -OutFile $OutputPath `
            -Headers $headers `
            -UseBasicParsing `
            -TimeoutSec 600 `
            -MaximumRedirection 10 `
            -ErrorAction Stop
        
        if (Test-Path $OutputPath) {
            $size = [math]::Round((Get-Item $OutputPath).Length / 1MB, 2)
            Write-Log "  SUCCESS: Downloaded $size MB via Invoke-WebRequest" "Green"
            return $true
        }
    } catch {
        Write-Log "  Invoke-WebRequest failed: $($_.Exception.Message)" "Yellow"
    }
    
    # Method 4: Alternative URLs/Mirrors
    if ($Url -like "*tesseract*") {
        Write-Log "  Trying alternative Tesseract source..." "Yellow"
        $altUrls = @(
            "https://github.com/UB-Mannheim/tesseract/releases/download/v5.4.0.20240606/tesseract-ocr-w64-setup-5.4.0.20240606.exe",
            "https://digi.bib.uni-mannheim.de/tesseract/tesseract-ocr-w64-setup-5.3.3.20231005.exe"
        )
        
        foreach ($altUrl in $altUrls) {
            try {
                Write-Log "  Trying: $altUrl" "Gray"
                $webClient = New-Object System.Net.WebClient
                $webClient.Headers.Add("User-Agent", "Mozilla/5.0")
                $webClient.DownloadFile($altUrl, $OutputPath)
                $webClient.Dispose()
                
                if (Test-Path $OutputPath) {
                    $size = [math]::Round((Get-Item $OutputPath).Length / 1MB, 2)
                    if ($size -gt 10) {  # Valid installer should be > 10MB
                        Write-Log "  SUCCESS: Downloaded from alternative source ($size MB)" "Green"
                        return $true
                    }
                }
            } catch {
                Write-Log "  Alternative URL failed: $($_.Exception.Message)" "Yellow"
            }
        }
    }
    
    Write-Log "  FAILED: All download methods exhausted" "Red"
    return $false
}

# Install Tesseract OCR
function Install-Tesseract {
    Write-Log "" "White"
    Write-Log "[1/3] Installing Tesseract OCR..." "Cyan"
    
    # Check if already installed
    $tesseractExe = "$TESSERACT_DIR\tesseract.exe"
    if ((Test-Path $tesseractExe) -and -not $Force) {
        Write-Log "  Tesseract already installed at: $TESSERACT_DIR" "Green"
        Add-ToUserPath -Path $TESSERACT_DIR
        return $true
    }
    
    # Check system-wide installation
    $systemPaths = @(
        "C:\Program Files\Tesseract-OCR\tesseract.exe",
        "C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"
    )
    
    foreach ($path in $systemPaths) {
        if (Test-Path $path) {
            Write-Log "  Found system Tesseract at: $path" "Green"
            $script:TESSERACT_DIR = Split-Path $path -Parent
            Add-ToUserPath -Path $script:TESSERACT_DIR
            return $true
        }
    }
    
    # Download installer
    $installerUrl = "https://digi.bib.uni-mannheim.de/tesseract/tesseract-ocr-w64-setup-5.4.0.20240606.exe"
    $installerPath = "$TEMP_DIR\tesseract-installer.exe"
    
    Write-Log "  Downloading Tesseract installer..." "Yellow"
    if (-not (Download-FileAdvanced -Url $installerUrl -OutputPath $installerPath -Description "Tesseract OCR")) {
        Write-Log "  ERROR: Failed to download Tesseract installer" "Red"
        return $false
    }
    
    # Verify download
    if (-not (Test-Path $installerPath)) {
        Write-Log "  ERROR: Installer file not found after download" "Red"
        return $false
    }
    
    $fileSize = (Get-Item $installerPath).Length
    if ($fileSize -lt 10MB) {
        Write-Log "  ERROR: Downloaded file too small ($fileSize bytes), likely corrupted" "Red"
        Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
        return $false
    }
    
    # Install silently
    try {
        Write-Log "  Installing Tesseract (this may take 1-2 minutes)..." "Yellow"
        Write-Log "  Target directory: $TESSERACT_DIR" "Gray"
        
        # Create installation directory
        New-Item -ItemType Directory -Path $TESSERACT_DIR -Force | Out-Null
        
        # Run installer using Start-Process with proper flags
        $arguments = "/VERYSILENT /NORESTART /DIR=`"$TESSERACT_DIR`""
        
        Write-Log "  Executing: $installerPath $arguments" "Gray"
        
        $process = Start-Process -FilePath $installerPath -ArgumentList $arguments -Wait -PassThru -WindowStyle Hidden
        
        $exitCode = $process.ExitCode
        Write-Log "  Installer exit code: $exitCode" "Gray"
        
        # Wait a bit for filesystem to settle
        Start-Sleep -Seconds 3
        
        # Verify installation
        if (Test-Path "$TESSERACT_DIR\tesseract.exe") {
            Write-Log "  SUCCESS: Tesseract installed successfully!" "Green"
            
            # Clean up installer
            Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
            
            # Add to PATH
            Add-ToUserPath -Path $TESSERACT_DIR
            
            return $true
        } else {
            Write-Log "  ERROR: Installation completed but tesseract.exe not found" "Red"
            Write-Log "  Checked: $TESSERACT_DIR\tesseract.exe" "Red"
            
            # List what's in the directory for debugging
            if (Test-Path $TESSERACT_DIR) {
                Write-Log "  Directory contents:" "Gray"
                Get-ChildItem $TESSERACT_DIR -Recurse -File | Select-Object -First 10 | ForEach-Object {
                    Write-Log "    $($_.FullName)" "Gray"
                }
            }
            
            return $false
        }
    } catch {
        Write-Log "  ERROR: Installation failed - $($_.Exception.Message)" "Red"
        return $false
    }
}

# Install Poppler
function Install-Poppler {
    Write-Log "" "White"
    Write-Log "[2/3] Installing Poppler..." "Cyan"
    
    # Function to test if Poppler is functional
    function Test-PopplerFunctional {
        param([string]$BinPath)
        
        if (-not (Test-Path $BinPath)) {
            return $false
        }
        
        $pdfToPpmExe = Join-Path $BinPath "pdftoppm.exe"
        if (-not (Test-Path $pdfToPpmExe)) {
            return $false
        }
        
        # Test if command actually works
        try {
            $testOutput = & $pdfToPpmExe -v 2>&1
            if ($testOutput -match "pdftoppm version" -or $testOutput -match "poppler") {
                return $true
            }
        } catch {
            return $false
        }
        
        return $false
    }
    
    # Check local installation
    $localBinPath = "$POPPLER_DIR\poppler-24.08.0\Library\bin"
    if (Test-PopplerFunctional -BinPath $localBinPath) {
        Write-Log "  Poppler already installed and functional" "Green"
        Add-ToUserPath -Path $localBinPath
        return $true
    }
    
    # Check system installation
    $systemBinPath = "C:\Program Files\poppler\Library\bin"
    if (Test-PopplerFunctional -BinPath $systemBinPath) {
        Write-Log "  Found functional system Poppler installation" "Green"
        Add-ToUserPath -Path $systemBinPath
        return $true
    }
    
    # If directory exists but not functional, remove it
    if (Test-Path $POPPLER_DIR) {
        Write-Log "  Found non-functional Poppler installation, removing..." "Yellow"
        Remove-Item $POPPLER_DIR -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    # Download Poppler
    $popplerUrl = "https://github.com/oschwartz10612/poppler-windows/releases/download/v24.08.0-0/Release-24.08.0-0.zip"
    $zipPath = "$TEMP_DIR\poppler.zip"
    
    Write-Log "  Downloading Poppler..." "Yellow"
    if (-not (Download-FileAdvanced -Url $popplerUrl -OutputPath $zipPath -Description "Poppler")) {
        Write-Log "  ERROR: Failed to download Poppler" "Red"
        return $false
    }
    
    # Verify download
    if (-not (Test-Path $zipPath)) {
        Write-Log "  ERROR: ZIP file not found after download" "Red"
        return $false
    }
    
    # Extract
    try {
        Write-Log "  Extracting Poppler..." "Yellow"
        
        # Remove old installation
        if (Test-Path $POPPLER_DIR) {
            Remove-Item $POPPLER_DIR -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        New-Item -ItemType Directory -Path $POPPLER_DIR -Force | Out-Null
        
        # Extract ZIP
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $POPPLER_DIR)
        
        Write-Log "  SUCCESS: Poppler extracted successfully!" "Green"
        
        # Clean up ZIP
        Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
        
        # Find bin directory and add to PATH
        $binDirs = Get-ChildItem -Path $POPPLER_DIR -Recurse -Directory -Filter "bin" -ErrorAction SilentlyContinue
        
        $foundWorking = $false
        foreach ($binDir in $binDirs) {
            $pdfToPpmPath = Join-Path $binDir.FullName "pdftoppm.exe"
            if (Test-Path $pdfToPpmPath) {
                Write-Log "  Found Poppler bin: $($binDir.FullName)" "Green"
                
                # Test if it's functional
                if (Test-PopplerFunctional -BinPath $binDir.FullName) {
                    Write-Log "  Verified Poppler is functional" "Green"
                    Add-ToUserPath -Path $binDir.FullName
                    $foundWorking = $true
                    break
                } else {
                    Write-Log "  WARNING: Found pdftoppm.exe but it's not responding correctly" "Yellow"
                }
            }
        }
        
        if ($foundWorking) {
            return $true
        } else {
            Write-Log "  ERROR: Poppler extracted but no functional installation found" "Red"
            return $false
        }
        
    } catch {
        Write-Log "  ERROR: Extraction failed - $($_.Exception.Message)" "Red"
        return $false
    }
}

# Install Python packages
function Install-PythonPackages {
    Write-Log "" "White"
    Write-Log "[3/3] Installing Python Packages..." "Cyan"
    
    # Check Python
    try {
        $pythonVersion = & python --version 2>&1
        Write-Log "  Python version: $pythonVersion" "Green"
    } catch {
        Write-Log "  ERROR: Python not found. Please install Python 3.8+" "Red"
        return $false
    }
    
    # Upgrade pip
    Write-Log "  Upgrading pip..." "Yellow"
    & python -m pip install --upgrade pip --quiet 2>&1 | Out-Null
    
    # Package list
    $packages = @(
        "pytesseract",
        "pillow",
        "pdf2image",
        "PyPDF2",
        "python-docx",
        "opencv-python",
        "numpy"
    )
    
    Write-Log "  Installing Python packages..." "Yellow"
    
    $failed = @()
    foreach ($pkg in $packages) {
        try {
            Write-Log "    Installing $pkg..." "Gray"
            
            if ($pkg -match "numpy|opencv") {
                $output = & python -m pip install --only-binary :all: $pkg --quiet 2>&1
            } else {
                $output = & python -m pip install $pkg --quiet 2>&1
            }
            
            if ($LASTEXITCODE -eq 0) {
                Write-Log "    SUCCESS: $pkg installed" "Green"
            } else {
                Write-Log "    FAILED: $pkg" "Red"
                $failed += $pkg
            }
        } catch {
            Write-Log "    FAILED: $pkg - $($_.Exception.Message)" "Red"
            $failed += $pkg
        }
    }
    
    if ($failed.Count -eq 0) {
        Write-Log "  SUCCESS: All Python packages installed!" "Green"
        return $true
    } else {
        Write-Log "  WARNING: Some packages failed: $($failed -join ', ')" "Yellow"
        # Return true if core packages succeeded
        $criticalFailed = $failed | Where-Object { $_ -in @("pytesseract", "pillow", "pdf2image") }
        return ($criticalFailed.Count -eq 0)
    }
}

# Add directory to User PATH
function Add-ToUserPath {
    param([string]$Path)
    
    if (-not (Test-Path $Path)) {
        Write-Log "  WARNING: Path does not exist: $Path" "Yellow"
        return
    }
    
    # Add to current session immediately
    if ($env:PATH -notlike "*$Path*") {
        $env:PATH = "$Path;$env:PATH"
        Write-Log "  Added to current session PATH: $Path" "Green"
    }
    
    # Add to User PATH permanently
    try {
        $userPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)
        if ($userPath -notlike "*$Path*") {
            $newPath = "$userPath;$Path"
            [Environment]::SetEnvironmentVariable("Path", $newPath, [EnvironmentVariableTarget]::User)
            Write-Log "  Added to permanent User PATH: $Path" "Green"
        }
    } catch {
        Write-Log "  WARNING: Could not update permanent PATH: $($_.Exception.Message)" "Yellow"
    }
}

# Verify installations
function Verify-Installations {
    Write-Log "" "White"
    Write-Log "=========================================================" "Cyan"
    Write-Log "Verifying Installations..." "Cyan"
    Write-Log "=========================================================" "Cyan"
    
    $allGood = $true
    
    # Test Tesseract
    try {
        $version = & tesseract --version 2>&1 | Select-Object -First 1
        Write-Log "[OK] Tesseract: $version" "Green"
    } catch {
        Write-Log "[FAIL] Tesseract not accessible" "Red"
        $allGood = $false
    }
    
    # Test Poppler
    try {
        $version = & pdftoppm -v 2>&1 | Select-Object -First 1
        Write-Log "[OK] Poppler: $version" "Green"
    } catch {
        Write-Log "[FAIL] Poppler not accessible" "Red"
        $allGood = $false
    }
    
    # Test Python packages
    $testScript = @"
import sys
packages = ['pytesseract', 'PIL', 'pdf2image', 'PyPDF2', 'docx', 'cv2', 'numpy']
failed = []
for pkg in packages:
    try:
        __import__(pkg)
    except ImportError:
        failed.append(pkg)
        
if failed:
    print('FAILED:' + ','.join(failed))
    sys.exit(1)
else:
    print('OK')
    sys.exit(0)
"@
    
    try {
        $result = & python -c $testScript 2>&1
        if ($result -like "*OK*") {
            Write-Log "[OK] All Python packages verified" "Green"
        } else {
            Write-Log "[FAIL] Some Python packages missing: $result" "Red"
            $allGood = $false
        }
    } catch {
        Write-Log "[FAIL] Python package verification failed" "Red"
        $allGood = $false
    }
    
    return $allGood
}

# Main installation flow
try {
    # Install components
    $tesseractOk = Install-Tesseract
    $popplerOk = Install-Poppler
    $pythonOk = Install-PythonPackages
    
    # Verify
    Write-Log "" "White"
    $verified = Verify-Installations
    
    # Results
    Write-Log "" "White"
    Write-Log "=========================================================" "Cyan"
    
    if ($tesseractOk -and $popplerOk -and $pythonOk -and $verified) {
        Write-Log "INSTALLATION COMPLETED SUCCESSFULLY!" "Green"
        Write-Log "=========================================================" "Cyan"
        Write-Log "" "White"
        Write-Log "All dependencies installed and verified!" "Green"
        Write-Log "Installation log: $INSTALL_LOG" "Gray"
        Write-Log "" "White"
        Write-Log "NOTE: If PATH commands don't work immediately," "Yellow"
        Write-Log "      the current PowerShell session has been updated." "Yellow"
        Write-Log "      New sessions will use the permanent PATH." "Yellow"
        Write-Log "" "White"
        
        # Clean up temp directory
        if (Test-Path $TEMP_DIR) {
            Remove-Item $TEMP_DIR -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        exit 0
    } else {
        Write-Log "INSTALLATION COMPLETED WITH ERRORS" "Red"
        Write-Log "=========================================================" "Cyan"
        Write-Log "" "White"
        Write-Log "Some components failed to install:" "Yellow"
        if (-not $tesseractOk) { Write-Log "  - Tesseract OCR" "Red" }
        if (-not $popplerOk) { Write-Log "  - Poppler" "Red" }
        if (-not $pythonOk) { Write-Log "  - Python packages" "Red" }
        Write-Log "" "White"
        Write-Log "Check installation log: $INSTALL_LOG" "Yellow"
        Write-Log "" "White"
        
        exit 1
    }
} catch {
    Write-Log "" "White"
    Write-Log "=========================================================" "Red"
    Write-Log "FATAL ERROR DURING INSTALLATION" "Red"
    Write-Log "=========================================================" "Red"
    Write-Log $_.Exception.Message "Red"
    Write-Log "" "White"
    Write-Log "Check installation log: $INSTALL_LOG" "Yellow"
    Write-Log "" "White"
    
    exit 1
}
