@echo off
rem ICT - cai dat tren may moi: bam dup mot lan. Tai ma moi nhat tu GitHub ve %LOCALAPPDATA%\ICT-Hub\app roi chay local\setup.ps1.
rem Muon khoi dien lai token: dat tep config.env (lay tu may da cai) ngay canh tep nay truoc khi chay.
rem Chay lai tep nay de cap nhat len ban moi nhat.
chcp 65001 >nul
title ICT - Cai dat may moi
setlocal
set "HUB=%LOCALAPPDATA%\ICT-Hub"
set "ZIP=%TEMP%\ict-hoc-main.zip"
if not defined ICT_ZIP_URL set "ICT_ZIP_URL=https://github.com/iamtriet/ict-hoc/archive/refs/heads/main.zip"
set "ICT_FROM=%~dp0"
echo ICT: cai gia MT5 va gui tin Telegram tren may nay.
echo.
echo Tai ma moi nhat tu %ICT_ZIP_URL%
if not exist "%HUB%" mkdir "%HUB%"
curl.exe -fL --retry 3 -o "%ZIP%" "%ICT_ZIP_URL%"
if errorlevel 1 goto loitai
if exist "%HUB%\moi" rmdir /s /q "%HUB%\moi"
mkdir "%HUB%\moi"
tar.exe -xf "%ZIP%" -C "%HUB%\moi"
if errorlevel 1 goto loigiai
if not exist "%HUB%\moi\ict-hoc-main\local\setup.ps1" goto loigiai
if exist "%HUB%\cu" rmdir /s /q "%HUB%\cu"
if exist "%HUB%\app" move "%HUB%\app" "%HUB%\cu" >nul 2>nul
if exist "%HUB%\app" goto dangmo
move "%HUB%\moi\ict-hoc-main" "%HUB%\app" >nul
if errorlevel 1 goto loigiai
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File "%HUB%\app\local\setup.ps1"
echo.
pause
exit /b

:loitai
echo Khong tai duoc ma. Kiem tra mang roi chay lai.
pause
exit /b 1

:loigiai
echo Khong giai nen duoc ma vua tai. Chay lai tep nay.
pause
exit /b 1

:dangmo
echo Ban cu dang mo. Dong cua so ICT Local va ICT Telegram roi chay lai tep nay.
pause
exit /b 1
