@echo off
setlocal enabledelayedexpansion
title NIRA -- Build Android APK

echo ========================================================================
echo                 NIRA -- Android APK Build Tool
echo ========================================================================
echo.

set "PROJECT_ROOT=%~dp0"
set "JAVA_HOME=C:\Program Files\Java\jdk-21.0.10"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo [*] Using Java JDK: %JAVA_HOME%
java -version 2>&1 | findstr /i "version"
echo.

:: 1. Build frontend bundle
echo [*] Step 1/3: Building frontend web assets...
cd /d "%PROJECT_ROOT%frontend"
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed.
    pause
    exit /b 1
)

:: 2. Sync to Capacitor Android
echo.
echo [*] Step 2/3: Syncing web bundle to Android project...
call npx cap copy android
if %errorlevel% neq 0 (
    echo [ERROR] Capacitor sync failed.
    pause
    exit /b 1
)

:: 3. Compile Android APK with Gradle
echo.
echo [*] Step 3/3: Compiling installable Android APK with Gradle...
cd /d "%PROJECT_ROOT%frontend\android"
call .\gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo [ERROR] Gradle compilation failed.
    pause
    exit /b 1
)

:: Copy to root dist/android/ and top-level release/
if not exist "%PROJECT_ROOT%dist\android\" mkdir "%PROJECT_ROOT%dist\android\"
if not exist "%PROJECT_ROOT%release\" mkdir "%PROJECT_ROOT%release\"

set "LEGACY_APK=%PROJECT_ROOT%dist\android\Nira-Android-debug.apk"
set "RELEASE_APK=%PROJECT_ROOT%release\NIRA-v1.0.0-debug.apk"

copy /Y "%PROJECT_ROOT%frontend\android\app\build\outputs\apk\debug\app-debug.apk" "%LEGACY_APK%" >nul
copy /Y "%PROJECT_ROOT%frontend\android\app\build\outputs\apk\debug\app-debug.apk" "%RELEASE_APK%" >nul

:: Generate SHA-256 checksum for release artifact
powershell -NoProfile -Command "(Get-FileHash -Path '%RELEASE_APK%' -Algorithm SHA256).Hash + '  NIRA-v1.0.0-debug.apk'" > "%PROJECT_ROOT%release\SHA256SUMS.txt"

echo.
echo ========================================================================
echo   [SUCCESS] NIRA ANDROID APK BUILT SUCCESSFULLY!
echo ========================================================================
echo.
echo   Primary Release APK: %RELEASE_APK%
echo   Legacy Output APK:   %LEGACY_APK%
echo   SHA-256 Checksum:    %PROJECT_ROOT%release\SHA256SUMS.txt
echo.
echo   Install on OPPO F25 Pro via USB, adb install, or file transfer.
echo.
pause
exit /b 0
