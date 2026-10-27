@echo off
setlocal
title Create NIRA Desktop Shortcut

echo ========================================================================
echo                 NIRA -- Create Desktop Shortcut
echo ========================================================================
echo.

set "PROJECT_ROOT=%~dp0"
set "TARGET_BAT=%PROJECT_ROOT%START_NIRA.bat"
set "DESKTOP=%USERPROFILE%\Desktop"
set "SHORTCUT=%DESKTOP%\NIRA.lnk"

echo [*] Target executable: %TARGET_BAT%
echo [*] Shortcut path    : %SHORTCUT%
echo.

powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT%'); $s.TargetPath = '%TARGET_BAT%'; $s.WorkingDirectory = '%PROJECT_ROOT%'; $s.IconLocation = '%PROJECT_ROOT%app.ico'; $s.Description = 'Launch NIRA Accessible Indian Currency Recognition'; $s.Save()"

if exist "%SHORTCUT%" (
    echo [SUCCESS] Desktop shortcut 'NIRA' created on your Desktop!
    echo You can now start NIRA anytime directly from your Desktop.
) else (
    echo [ERROR] Could not create shortcut. You can manually create a shortcut to START_NIRA.bat.
)

echo.
pause
exit /b 0
