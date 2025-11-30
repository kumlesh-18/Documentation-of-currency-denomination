@echo off
setlocal enabledelayedexpansion

echo ========================================
echo  Currency Documentation - Portable Version
echo ========================================
echo.

:: Get the directory where this script is located
set "PORTABLE_DIR=%~dp0"
cd /d "%PORTABLE_DIR%"

:: Set paths
set "NODE_DIR=%PORTABLE_DIR%runtime\node"
set "APP_DIR=%PORTABLE_DIR%app"
set "NODE_EXE=%NODE_DIR%\node.exe"

:: Check if Node.js runtime exists
if not exist "%NODE_EXE%" (
    echo [ERROR] Node.js runtime not found!
    echo Expected location: %NODE_EXE%
    echo.
    echo Please ensure the portable package is complete.
    pause
    exit /b 1
)

:: Set environment variables
set "PATH=%NODE_DIR%;%PATH%"
set "NODE_ENV=production"

:: Display startup info
echo [INFO] Starting Documentation Server...
echo [INFO] Portable Directory: %PORTABLE_DIR%
echo [INFO] Node.js Version:
"%NODE_EXE%" --version
echo.

:: Start the server
echo [INFO] Server starting on http://localhost:3000
echo [INFO] Password: currency2025
echo.
echo ========================================
echo  Press Ctrl+C to stop the server
echo ========================================
echo.

cd /d "%APP_DIR%"
"%NODE_EXE%" server\server.js

:: If server exits
echo.
echo [INFO] Server stopped.
pause
