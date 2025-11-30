@echo off
setlocal enabledelayedexpansion

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
    pause
    exit /b 1
)

:: Set environment
set "PATH=%NODE_DIR%;%PATH%"
set "NODE_ENV=production"

:: Start server in background
echo Starting Documentation Server...
cd /d "%APP_DIR%"
start "" /B "%NODE_EXE%" server\server.js

:: Wait 2 seconds for server to start
timeout /t 2 /nobreak >nul

:: Open browser
echo Opening browser...
start http://localhost:3000

:: Keep window open to show server is running
echo.
echo ========================================
echo  Documentation Server is Running
echo ========================================
echo.
echo  URL: http://localhost:3000
echo  Password: currency2025
echo.
echo  Close this window to stop the server
echo ========================================
echo.

:: Wait for user to close window
pause >nul
