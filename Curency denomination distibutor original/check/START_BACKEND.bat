@echo off
REM Currency Distributor Backend - Easy Start
REM Double-click this file to start the backend with automatic dependency installation

echo ====================================================
echo Currency Distributor Backend - Auto Start
echo ====================================================
echo.

REM Run PowerShell script with auto-install
PowerShell.exe -ExecutionPolicy Bypass -File "%~dp0start_with_auto_install.ps1"

pause
