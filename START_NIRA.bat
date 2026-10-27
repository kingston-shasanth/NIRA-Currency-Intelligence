@echo off
setlocal enabledelayedexpansion
title NIRA Launcher -- Accessible Currency Intelligence

echo ========================================================================
echo             NIRA -- Accessible Indian Currency Intelligence
echo        PyTorch ResNet-18 [NVIDIA RTX 2050 CUDA] + FastAPI + React
echo ========================================================================
echo.

:: 1. Locate project root directory safely
set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"
echo [*] Project Directory: %PROJECT_ROOT%

:: 2. Pre-flight dependency validation
echo [*] Validating runtime dependencies...

:: Check Python virtual environment
if not exist "%PROJECT_ROOT%backend\.venv\Scripts\python.exe" (
    set "FAILED_STEP=Python virtual environment missing"
    echo.
    echo [ERROR] Python virtual environment was not found.
    echo Expected path: %PROJECT_ROOT%backend\.venv\Scripts\python.exe
    goto ON_ERROR
)

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    set "FAILED_STEP=Node.js runtime missing in PATH"
    echo.
    echo [ERROR] Node.js is not installed or not available in system PATH.
    goto ON_ERROR
)

:: Check frontend node_modules
if not exist "%PROJECT_ROOT%frontend\node_modules\" (
    set "FAILED_STEP=Frontend dependencies [node_modules] missing"
    echo.
    echo [ERROR] Frontend node_modules directory was not found.
    goto ON_ERROR
)

echo [OK] Python venv, Node.js, and frontend dependencies verified.
echo.

:: 3. Detect Laptop LAN and Hotspot IPv4 Addresses safely
echo [*] Detecting network interfaces...
set "HOTSPOT_IP=NONE"
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -ExecutionPolicy Bypass -File "%PROJECT_ROOT%scripts\get_lan_ip.ps1" -Mode Hotspot 2^>nul`) do (
    if not "%%i"=="" set "HOTSPOT_IP=%%i"
)

set "WIFI_IP=NONE"
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -ExecutionPolicy Bypass -File "%PROJECT_ROOT%scripts\get_lan_ip.ps1" -Mode WiFi 2^>nul`) do (
    if not "%%i"=="" set "WIFI_IP=%%i"
)

if /i "%HOTSPOT_IP%"=="NONE" (
    echo [-] Windows Mobile Hotspot adapter not detected.
    echo     To connect OPPO F25 Pro via hotspot: Turn on Windows Mobile Hotspot in Windows Settings.
    set "PREFERRED_PHONE_IP=%WIFI_IP%"
) else (
    echo [OK] Laptop Hotspot IP [OPPO F25 Pro]: %HOTSPOT_IP%
    set "PREFERRED_PHONE_IP=%HOTSPOT_IP%"
)

if not "%WIFI_IP%"=="NONE" (
    echo [OK] Laptop Wi-Fi IP [Local LAN]: %WIFI_IP%
)

if /i "%HOTSPOT_IP%"=="NONE" if /i "%WIFI_IP%"=="NONE" (
    echo [WARNING] No active mobile hotspot or Wi-Fi IPv4 address detected.
    echo           Starting NIRA in local-only mode [127.0.0.1].
    set "PREFERRED_PHONE_IP=127.0.0.1"
)
echo.

:: 4. Check if Backend is already active on port 8000
set "BACKEND_WAS_RUNNING=0"
netstat -ano | findstr /R ":8000.*LISTENING" >nul 2>nul
if %errorlevel% equ 0 (
    echo [i] Backend process is already active on port 8000. Skipping new launch.
    set "BACKEND_WAS_RUNNING=1"
) else (
    echo [*] Starting FastAPI Backend on 0.0.0.0:8000 [RTX 2050 CUDA]...
    start "NIRA Backend" cmd /k "title NIRA Backend && cd /d "%PROJECT_ROOT%backend" && .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
)

:: 5. Check if Frontend is already active on port 5173
set "FRONTEND_WAS_RUNNING=0"
netstat -ano | findstr /R ":5173.*LISTENING" >nul 2>nul
if %errorlevel% equ 0 (
    echo [i] Frontend dev server is already active on port 5173. Skipping new launch.
    set "FRONTEND_WAS_RUNNING=1"
) else (
    echo [*] Starting Vite Frontend on 0.0.0.0:5173...
    start "NIRA Frontend" cmd /k "title NIRA Frontend && cd /d "%PROJECT_ROOT%frontend" && npx vite --host 0.0.0.0 --port 5173"
)

:: Track if all services were already active prior to this script running
set "SERVICES_ALREADY_ACTIVE=0"
if "%BACKEND_WAS_RUNNING%"=="1" if "%FRONTEND_WAS_RUNNING%"=="1" (
    set "SERVICES_ALREADY_ACTIVE=1"
)

:: 6. Health check polling loop with timeout
echo.
echo [*] Polling health and model endpoints...
set /a ATTEMPTS=0
set /a MAX_ATTEMPTS=35

:WAIT_LOOP
set /a ATTEMPTS+=1

:: Check backend health endpoint
powershell -NoProfile -ExecutionPolicy Bypass -File "%PROJECT_ROOT%scripts\check_health.ps1" -Url "http://127.0.0.1:8000/api/health"
if %errorlevel% equ 0 (
    set "BACKEND_UP=1"
) else (
    set "BACKEND_UP=0"
)

:: Check model readiness endpoint separately
powershell -NoProfile -ExecutionPolicy Bypass -File "%PROJECT_ROOT%scripts\check_health.ps1" -Url "http://127.0.0.1:8000/api/model/status"
if %errorlevel% equ 0 (
    set "MODEL_UP=1"
) else (
    set "MODEL_UP=0"
)

:: Check frontend HTTP endpoint
powershell -NoProfile -ExecutionPolicy Bypass -File "%PROJECT_ROOT%scripts\check_health.ps1" -Url "http://127.0.0.1:5173"
if %errorlevel% equ 0 (
    set "FRONTEND_UP=1"
) else (
    set "FRONTEND_UP=0"
)

if "%BACKEND_UP%"=="1" (
    if "%FRONTEND_UP%"=="1" (
        goto STARTUP_SUCCESS
    )
)

if %ATTEMPTS% geq %MAX_ATTEMPTS% (
    set "FAILED_STEP=Services failed to respond within timeout"
    echo.
    echo ========================================================================
    echo   [ERROR] Startup health check timed out after %MAX_ATTEMPTS% attempts.
    echo ========================================================================
    if "%BACKEND_UP%"=="0" (
        echo   [FAIL] Backend on port 8000 did not respond to /api/health.
        echo          Check the 'NIRA Backend' window for Python errors.
    )
    if "%FRONTEND_UP%"=="0" (
        echo   [FAIL] Frontend on port 5173 did not respond.
        echo          Check the 'NIRA Frontend' window for Vite errors.
    )
    echo.
    goto ON_ERROR
)

echo    ... verifying services [attempt %ATTEMPTS% of %MAX_ATTEMPTS%]...
ping 127.0.0.1 -n 2 >nul
goto WAIT_LOOP

:STARTUP_SUCCESS
echo.
echo ========================================================================
echo   [SUCCESS] NIRA SERVICES ARE ACTIVE AND RESPONSIVE
echo ========================================================================
echo.
echo   ==================== DASHBOARD ACCESS URLS ====================
echo.
echo   [Local Access - Laptop Browser]
echo   Local Dashboard URL       : http://localhost:5173/dashboard
echo   Local Backend API URL     : http://localhost:8000/api
echo.
if not "%HOTSPOT_IP%"=="NONE" (
    echo   [Mobile Access - OPPO F25 Pro Hotspot]
    echo   Mobile Dashboard URL      : http://%HOTSPOT_IP%:5173/dashboard
    echo   Mobile Backend API URL    : http://%HOTSPOT_IP%:8000/api
    echo.
)
if not "%WIFI_IP%"=="NONE" (
    echo   [Mobile Access - Local Wi-Fi Network]
    echo   Mobile Dashboard URL      : http://%WIFI_IP%:5173/dashboard
    echo   Mobile Backend API URL    : http://%WIFI_IP%:8000/api
    echo.
)
if /i "%HOTSPOT_IP%"=="NONE" if /i "%WIFI_IP%"=="NONE" (
    echo   [Mobile Access Notice]
    echo   No active Wi-Fi or Mobile Hotspot IPv4 address detected.
    echo   To access from mobile: Connect phone and laptop to same Wi-Fi or
    echo   turn on Windows Mobile Hotspot in Windows Settings.
    echo   Then open: http://^<CURRENT_LAPTOP_IP^>:5173/dashboard
    echo.
)
echo   ==============================================================
echo.

:: Model verification summary
if "%MODEL_UP%"=="1" (
    echo   Model Checkpoint          : [READY] ResNet-18 weights verified on RTX 2050 CUDA
) else (
    echo   Model Checkpoint          : [NOTICE] Checkpoint loading or awaiting verification
)

:: Android APK location
if exist "%PROJECT_ROOT%dist\android\Nira-Android-debug.apk" (
    echo   Android APK               : %PROJECT_ROOT%dist\android\Nira-Android-debug.apk
)
echo.
echo ========================================================================
echo.

:OPEN_APP
:: Prevent launching multiple browser tabs/windows on repeated startup attempts
if "%SERVICES_ALREADY_ACTIVE%"=="1" (
    echo [*] NIRA backend and frontend services were already running.
    echo [*] Skipping browser launch to prevent opening multiple dashboard tabs.
    echo [*] Copyable Dashboard URL: http://localhost:5173/dashboard
) else (
    echo [*] Opening NIRA Admin Dashboard in your default browser...
    start "" "http://localhost:5173/dashboard"
)

echo.
echo NIRA is running. Press any key or run STOP_NIRA.bat to terminate services.
pause >nul
exit /b 0

:ON_ERROR
echo.
echo ========================================================================
echo   [STARTUP FAILED] Step: %FAILED_STEP%
echo ========================================================================
echo.
pause
exit /b 1
