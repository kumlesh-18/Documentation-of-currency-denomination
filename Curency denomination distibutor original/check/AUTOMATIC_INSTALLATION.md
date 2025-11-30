# Automatic Dependency Installation System

## Overview

This system automatically installs **all required dependencies** for the OCR-enabled Currency Distribution Backend, similar to how `npm install` works for Node.js projects.

## What Gets Installed Automatically

### 1. **Tesseract OCR** (v5.3.3+)
- Optical Character Recognition engine
- Required for: Image text extraction, scanned PDF processing
- Installation: Silent install to `%LOCALAPPDATA%\CurrencyDistributor\Tesseract-OCR`

### 2. **Poppler** (v24.08.0+)
- PDF rendering utilities
- Required for: PDF to image conversion for OCR
- Installation: Extracted to `%LOCALAPPDATA%\CurrencyDistributor\poppler`

### 3. **Python Packages**
- **pytesseract** (≥0.3.10) - Python wrapper for Tesseract
- **pillow** (≥10.0.0) - Image processing
- **pdf2image** (≥1.16.0) - PDF to image conversion
- **PyPDF2** (≥3.0.0) - PDF text extraction
- **python-docx** (≥1.1.0) - Word document processing
- **opencv-python** (≥4.8.0) - Advanced image preprocessing
- **numpy** (≥1.24.0) - Numerical operations

## Usage Methods

### Method 1: Double-Click Startup (Easiest) ✅

1. Navigate to `packages/local-backend/`
2. Double-click **`START_BACKEND.bat`**
3. First run: Automatic installation begins (2-5 minutes)
4. Subsequent runs: Starts immediately

### Method 2: PowerShell Script

```powershell
cd packages/local-backend
.\start_with_auto_install.ps1
```

### Method 3: Existing Start Script (Enhanced)

```powershell
cd packages/local-backend
.\start.ps1
```

Now automatically detects and runs the auto-installer!

### Method 4: Manual Installation Only

```powershell
cd packages/local-backend
.\install_dependencies.ps1
```

Options:
- `-Force` - Reinstall all dependencies
- `-Silent` - Suppress console output

## How It Works

### First-Time Run

1. **Detection**: Checks if Tesseract and Poppler are installed
2. **Download**: Downloads installers from official sources
3. **Install**: Silently installs Tesseract and Poppler
4. **PATH Setup**: Adds tools to system PATH automatically
5. **Python Packages**: Installs all required Python libraries
6. **Verification**: Tests all installations
7. **Marker File**: Creates `.dependencies_installed` marker
8. **Server Start**: Launches backend server

**Time**: 2-5 minutes (download speed dependent)

### Subsequent Runs

1. **Quick Check**: Verifies marker file exists
2. **Validation**: Tests Tesseract and Poppler availability
3. **Server Start**: Immediately launches backend

**Time**: <5 seconds

## Installation Locations

### Tesseract OCR
```
Primary: %LOCALAPPDATA%\CurrencyDistributor\Tesseract-OCR\
Fallback Checks:
  - C:\Program Files\Tesseract-OCR\
  - C:\Program Files (x86)\Tesseract-OCR\
  - System PATH
```

### Poppler
```
Primary: %LOCALAPPDATA%\CurrencyDistributor\poppler\
Fallback Checks:
  - C:\Program Files\poppler\
  - System PATH
```

### Installation Log
```
%LOCALAPPDATA%\CurrencyDistributor\install.log
```

## Offline Capability

✅ **Internet Required**: First-time installation only  
✅ **Offline Mode**: All subsequent runs work completely offline  
✅ **No Network Checks**: Application never requires internet after setup

## Features

### Intelligent Detection
- ✅ Skips installation if dependencies already exist
- ✅ Detects multiple installation locations
- ✅ Verifies PATH and direct executable access
- ✅ Handles both local and system-wide installations

### Error Handling
- ✅ Detailed logging to `install.log`
- ✅ Color-coded console output
- ✅ Graceful fallback on partial failures
- ✅ Continues server startup even if some packages fail

### PATH Management
- ✅ Adds tools to User PATH (not System PATH - no admin required)
- ✅ Updates current session PATH immediately
- ✅ Persists across terminal restarts

## Troubleshooting

### Issue: "Tesseract not found" after installation

**Solution 1**: Restart PowerShell/Terminal
```powershell
# Close and reopen your terminal
# Or reload PATH:
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

**Solution 2**: Force reinstall
```powershell
.\install_dependencies.ps1 -Force
```

### Issue: Python packages fail to install

**Solution**: Install with pre-built wheels
```powershell
python -m pip install --only-binary :all: numpy opencv-python
python -m pip install pytesseract pillow pdf2image PyPDF2 python-docx
```

### Issue: "Download failed"

**Causes**: 
- No internet connection
- Firewall blocking downloads
- GitHub/external server down

**Solution**: Manual download
1. Download manually:
   - Tesseract: https://github.com/UB-Mannheim/tesseract/wiki
   - Poppler: https://github.com/oschwartz10612/poppler-windows/releases

2. Install manually:
   ```powershell
   # Run installers
   # Then mark as complete:
   New-Item -ItemType File -Path "packages/local-backend/.dependencies_installed" -Force
   ```

### Issue: Script execution policy error

**Error**: 
```
cannot be loaded because running scripts is disabled on this system
```

**Solution**:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Bypass -Force
```

Or run with bypass:
```powershell
PowerShell.exe -ExecutionPolicy Bypass -File start_with_auto_install.ps1
```

## Manual Verification

Check if everything is installed:

```powershell
# Test Tesseract
tesseract --version

# Test Poppler
pdftoppm -v

# Test Python packages
python -c "import pytesseract, PIL, pdf2image, PyPDF2, docx, cv2, numpy; print('All packages OK')"
```

## Force Reinstallation

To completely reinstall all dependencies:

```powershell
# Remove marker file
Remove-Item .dependencies_installed -Force

# Force reinstall
.\install_dependencies.ps1 -Force
```

## Architecture

### Scripts Overview

1. **`install_dependencies.ps1`**
   - Core installer logic
   - Downloads and installs Tesseract & Poppler
   - Installs Python packages
   - Verifies installations
   - ~500 lines, fully automated

2. **`start_with_auto_install.ps1`**
   - Entry point with dependency check
   - Calls installer if needed
   - Starts backend server
   - Manages marker file

3. **`start.ps1`** (Enhanced)
   - Original start script
   - Now auto-detects and uses `start_with_auto_install.ps1`
   - Backward compatible

4. **`START_BACKEND.bat`**
   - Double-click launcher
   - Runs PowerShell with bypass policy
   - User-friendly entry point

### Dependency Flow

```
START_BACKEND.bat
    ↓
start_with_auto_install.ps1
    ↓
Check .dependencies_installed marker
    ↓
If missing → install_dependencies.ps1
    ↓
    ├─ Download Tesseract
    ├─ Install Tesseract
    ├─ Download Poppler
    ├─ Extract Poppler
    ├─ Update PATH
    ├─ Install Python packages
    └─ Verify all installations
    ↓
Create .dependencies_installed marker
    ↓
Start backend server (uvicorn)
```

## Supported File Formats (After Installation)

With all dependencies installed, the backend supports:

- ✅ **CSV** - Direct parsing (no OCR needed)
- ✅ **Word (.docx)** - Text extraction (no OCR needed)
- ✅ **PDF (text-based)** - Direct text extraction (no OCR needed)
- ✅ **PDF (scanned)** - OCR processing with Tesseract
- ✅ **Images** - JPG, PNG, TIFF, BMP with OCR

## Development Notes

### Adding New Dependencies

To add a new Python package:

1. Update `requirements.txt`
2. Add to `$packages` array in `install_dependencies.ps1`:
```powershell
$packages = @(
    "pytesseract>=0.3.10",
    "your-new-package>=1.0.0"  # Add here
)
```

### Adding New Binary Tools

To add a new tool (like Tesseract/Poppler):

1. Add download URL constant
2. Create `Install-YourTool` function
3. Add to `Start-Installation` flow
4. Add to `Test-AllDependencies` verification

## Security

- ✅ Downloads from official sources only
- ✅ HTTPS connections
- ✅ No admin rights required (User PATH only)
- ✅ Local installation directory (sandboxed)
- ✅ No external script execution

## License & Credits

### Tesseract OCR
- License: Apache 2.0
- Source: https://github.com/tesseract-ocr/tesseract
- Maintained by: Google & Contributors

### Poppler
- License: GPL
- Source: https://poppler.freedesktop.org/
- Windows Build: https://github.com/oschwartz10612/poppler-windows

### Python Packages
- Various open-source licenses (MIT, BSD, Apache)
- See individual package documentation

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `START_BACKEND.bat` | Double-click easy start |
| `.\start_with_auto_install.ps1` | Auto-install + start |
| `.\start.ps1` | Legacy start (now auto-enhanced) |
| `.\install_dependencies.ps1` | Install dependencies only |
| `.\install_dependencies.ps1 -Force` | Force reinstall everything |
| `tesseract --version` | Verify Tesseract |
| `pdftoppm -v` | Verify Poppler |

---

**Ready to use!** Just double-click `START_BACKEND.bat` and everything installs automatically! 🎉
