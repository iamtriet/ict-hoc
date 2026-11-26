@echo off
rem Bam dup de chay ICT Live voi gia tu MetaTrader 5 tren may nay. Dong cua so de dung.
chcp 65001 >nul
title ICT Local - MT5
cd /d "%~dp0.."
rem bo cai (setup.ps1) ghi duong dan Python vao python.txt, phong khi Python khong nam trong PATH
set "PY=python"
if exist "%LOCALAPPDATA%\ICT-Telegram\python.txt" set /p PY=<"%LOCALAPPDATA%\ICT-Telegram\python.txt"
"%PY%" --version >nul 2>nul
if errorlevel 1 (
  echo Khong tim thay Python. Xem local\README.md
  pause
  exit /b 1
)
rem Neu da cai Telegram cho may nay (ICT-Telegram-CaiDat.bat) thi mo them cua so gui tin
if exist "%LOCALAPPDATA%\ICT-Telegram\config.env" (
  where node >nul 2>nul && start "ICT Telegram - MT5" cmd /c "node local\telegram.js & pause"
)
"%PY%" local\mt5_server.py --open
echo.
pause
