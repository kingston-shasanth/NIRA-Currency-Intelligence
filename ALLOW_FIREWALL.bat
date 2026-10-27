@echo off
setlocal
title NIRA -- Windows Firewall Configuration

echo ========================================================================
echo          NIRA -- Configure Windows Firewall for Phone Access
echo ========================================================================
echo.

:: Check for administrative rights
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Administrative privileges required.
    echo.
    echo Please right-click ALLOW_FIREWALL.bat and select:
    echo     "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo [*] Configuring inbound TCP ports 8000 (Backend API) and 5173 (Frontend)...
netsh advfirewall firewall delete rule name="NIRA Server" >nul 2>&1
netsh advfirewall firewall delete rule name="DRISHTI AI Server" >nul 2>&1
netsh advfirewall firewall add rule name="NIRA Server" dir=in action=allow protocol=TCP localport=8000,5173 profile=any >nul 2>&1

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Windows Firewall rule 'NIRA Server' added successfully!
    echo Phones connected to your local Wi-Fi or hotspot can now communicate with:
    echo   - Backend API : port 8000
    echo   - Frontend PWA: port 5173
    echo.
) else (
    echo.
    echo [ERROR] Failed to add firewall rule. Please check Windows Defender Firewall settings.
    echo.
)

pause
exit /b 0
