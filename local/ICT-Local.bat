@echo off
rem Bam dup de chay ICT Live voi gia tu MetaTrader 5 tren may nay. Dong cua so de dung.
chcp 65001 >nul
title ICT Local - MT5
cd /d "%~dp0.."
where python >nul 2>nul
if errorlevel 1 (
  echo Khong tim thay Python. Xem local\README.md
  pause
  exit /b 1
)
python local\mt5_server.py --open
echo.
pause
