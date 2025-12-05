@echo off
setlocal

echo ===================================================
echo Sugarcane Bill Recording System - Setup & Auto Start
echo ===================================================

cd /d "%~dp0"

:: 1. Install PM2 Globally (for background service)
echo.
echo [1/6] Installing PM2 and Windows Startup tools...
call npm install -g pm2 pm2-windows-startup

:: 2. Install Server Dependencies
echo.
echo [2/6] Installing Server Dependencies...
cd server
call npm install
cd ..

:: 3. Install Client Dependencies
echo.
echo [3/6] Installing Client Dependencies...
cd client
call npm install

:: 4. Build Client
echo.
echo [4/6] Building Client Application...
call npm run build
cd ..

:: 5. Setup PM2 Background Service
echo.
echo [5/6] Configuration PM2 Background Service...
:: Stop duplicate if exists
call pm2 stop sugarcane-system
call pm2 delete sugarcane-system

:: Start ecosystem
call pm2 start ecosystem.config.js
call pm2 save

:: Setup PM2 to run on boot
echo Installing PM2 Startup Hook...
call pm2-startup install
call pm2 save

:: 6. Create Browser Startup Shortcut
echo.
echo [6/6] Creating Browser Startup Shortcut...

set "SHORTCUT_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\SugarcaneSystem.url"
set "URL=http://localhost:5001"

echo [InternetShortcut] > "%SHORTCUT_PATH%"
echo URL=%URL% >> "%SHORTCUT_PATH%"

echo.
echo ===================================================
echo               SETUP COMPLETE!
echo ===================================================
echo.
echo 1. The server is now running in the background.
echo 2. It will automatically start when the computer turns on.
echo 3. The browser will automatically open %URL% on login.
echo.
echo NOTE: to access from other devices, use:
echo http://192.168.2.50:5001/ (or your current IP)
echo.
pause
