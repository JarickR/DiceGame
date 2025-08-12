@echo off
cd /d "%~dp0"
echo Starting Dice Arena...
call npm install
call npm run dev
pause