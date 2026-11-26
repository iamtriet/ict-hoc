@echo off
rem Cai dat gui tin Telegram tu may nay: mo tep cau hinh de dien token, roi gui mot tin thu.
chcp 65001 >nul
title ICT - Cai dat Telegram
cd /d "%~dp0.."
where node >nul 2>nul
if errorlevel 1 (
  echo Khong tim thay Node.js. Cai ban LTS tai https://nodejs.org roi chay lai.
  pause
  exit /b 1
)
for /f "delims=" %%F in ('node local\telegram.js --init') do set "ICTCFG=%%F"
echo Dien TG_BOT_TOKEN va TG_CHAT_ID vao tep vua mo, bam Ctrl+S roi dong Notepad.
start /wait notepad "%ICTCFG%"
node local\telegram.js --test
echo.
echo Neu da nhan tin thu: chay ICT-Local.bat de bat dau gui tin tu may nay.
pause
