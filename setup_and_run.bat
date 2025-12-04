@echo off
echo ==========================================
echo Sugarcane System - Windows Setup & Start
echo ==========================================

echo [1/5] Installing PM2 globally...
call npm install -g pm2

echo [2/5] Installing Server Dependencies...
cd server
call npm install
cd ..

echo [3/5] Installing Client Dependencies...
cd client
call npm install

echo [4/5] Building Client (Frontend)...
call npm run build
cd ..

echo [5/5] Starting Application in Background...
call pm2 start ecosystem.config.js
call pm2 save

echo ==========================================
echo Application is running!
echo Access it at: http://localhost:5001
echo To stop: pm2 stop sugarcane-system
echo To monitor: pm2 monit
echo ==========================================
pause
