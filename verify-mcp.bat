@echo off
REM MCP Server Verification Test Script (Windows)

echo ========================================
echo MCP Server Verification Tool
echo ========================================
echo.

echo [1/4] Checking Node.js Installation...
where node >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Node.js found:
    node --version
) else (
    echo ✗ Node.js NOT installed
    echo   Download from: https://nodejs.org/
)

echo.

echo [2/4] Checking VS Code Settings...
set SETTINGS_FILE=%APPDATA%\Code\User\settings.json
if exist "%SETTINGS_FILE%" (
    echo ✓ Settings file exists: %SETTINGS_FILE%
    findstr /I "markdown-docs" "%SETTINGS_FILE%" >nul
    if %errorlevel% equ 0 (
        echo ✓ MCP Server 'markdown-docs' registered
    ) else (
        echo ✗ MCP Server not found in settings
    )
) else (
    echo ✗ Settings file not found
)

echo.

echo [3/4] Checking Server File...
set SERVER_FILE=f:\ai-python\mcp-server-markdown.js
if exist "%SERVER_FILE%" (
    echo ✓ Server file exists:
    echo   %SERVER_FILE%
    for %%A in ("%SERVER_FILE%") do (
        echo   Size: %%~zA bytes
    )
) else (
    echo ✗ Server file not found
)

echo.

echo [4/4] Checking MCP Configuration...
findstr /I "chat.mcp.enabled.*true" "%SETTINGS_FILE%" >nul
if %errorlevel% equ 0 (
    echo ✓ MCP is enabled in VS Code
) else (
    echo ✗ MCP may be disabled
)

echo.
echo ========================================
echo Status Summary:
echo ========================================
echo.
echo 1. If Node.js is NOT installed:
echo    - Download from: https://nodejs.org/
echo    - Install and restart your computer
echo.
echo 2. Restart VS Code
echo    - Press Ctrl+Shift+P, select "Reload Window"
echo.
echo 3. Test in VS Code Chat:
echo    - Open Chat panel (Ctrl+Shift+Alt+I)
echo    - Ask: "@claude list the markdown tools available"
echo.
echo 4. Monitor MCP Server:
echo    - View > Output > Select "Markdown Documentation MCP"
echo.
echo ========================================
pause
