@echo off
setlocal enabledelayedexpansion
title Stop NIRA Services

echo ========================================================================
echo                   NIRA -- Stop Background Services
echo ========================================================================
echo.

echo [*] Finding and terminating NIRA processes...

:: 1. Terminate process listening on port 8000 [FastAPI Backend]
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /R ":8000.*LISTENING"') do (
    echo [*] Terminating Backend process [PID %%a] on port 8000...
    taskkill /F /PID %%a >nul 2>nul
)

:: 2. Terminate process listening on port 5173 [Vite Frontend]
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /R ":5173.*LISTENING"') do (
    echo [*] Terminating Frontend dev server [PID %%a] on port 5173...
    taskkill /F /PID %%a >nul 2>nul
)

:: 3. Close titled windows if still open
taskkill /F /FI "WINDOWTITLE eq NIRA Backend*" >nul 2>nul
taskkill /F /FI "WINDOWTITLE eq NIRA Frontend*" >nul 2>nul
taskkill /F /FI "WINDOWTITLE eq DRISHTI AI Backend*" >nul 2>nul
taskkill /F /FI "WINDOWTITLE eq DRISHTI AI Frontend*" >nul 2>nul

echo.
echo [OK] NIRA Backend and Frontend services have been stopped safely.
echo.
pause
exit /b 0
