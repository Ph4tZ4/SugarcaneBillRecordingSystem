@echo off
cd /d "%~dp0"
echo ==========================================
echo Sugarcane System - Auto Startup Configuration
echo ==========================================

echo [1/4] Installing pm2-windows-startup...
call npm install -g pm2-windows-startup

echo [2/4] Registering Startup Hook...
call pm2-startup install

echo [3/4] Starting Application...
call pm2 start ecosystem.config.js

echo [4/4] Saving Process List...
call pm2 save

echo ==========================================
echo Auto-startup configured successfully!
echo The application will now start automatically when you turn on the computer.
echo ==========================================
pause
