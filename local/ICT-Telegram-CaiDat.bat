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
start "" notepad "%ICTCFG%"
echo.
echo  1. Trong Notepad vua mo: dien token sau TG_BOT_TOKEN= va so chat id sau TG_CHAT_ID=
echo  2. Bam Ctrl+S de luu.
echo  3. Quay lai cua so nay va bam mot phim bat ky.
echo.
pause >nul
node local\telegram.js --test
if errorlevel 1 (
  echo.
  echo Chua gui duoc tin thu. Chay lai tep nay de sua token hoac chat id.
  pause
  exit /b 1
)
echo.
node local\telegram.js --bridge
if errorlevel 1 (
  echo Dang mo ICT Local va cua so gui tin...
  start "" "%~dp0ICT-Local.bat"
) else (
  echo Cau noi MT5 dang chay: mo cua so gui tin...
  start "ICT Telegram - MT5" cmd /c "node local\telegram.js & pause"
)
echo Xong. Giu cua so ICT Local va cua so ICT Telegram mo. Cua so nay co the dong.
pause
