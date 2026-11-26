# ICT - cai dat tren mot may: Python, Node.js, goi MetaTrader5, khoa Telegram, loi tat va tu chay khi dang nhap.
# Thuong duoc goi boi ICT-CaiDat-MayMoi.bat. Chay lai bao nhieu lan cung duoc. Viet khong dau de khong loi font.
# -DryRun: chi kiem tra va in ra viec se lam, khong cai, khong ghi, khong mo gi.
param([switch]$DryRun)
$ErrorActionPreference = 'Stop'
$App = Split-Path -Parent $PSScriptRoot
$Cfg = Join-Path $env:LOCALAPPDATA 'ICT-Telegram'
$Local = Join-Path $App 'local\ICT-Local.bat'

function Write-Step($n, $text) { Write-Host ''; Write-Host "[$n/6] $text" -ForegroundColor Cyan }
function Write-Info($text) { Write-Host "      $text" }
function Write-Warn($text) { Write-Host "      $text" -ForegroundColor Yellow }
function Wait-User($text) { if (-not $DryRun) { [void](Read-Host "      $text, roi bam Enter") } }
function Read-Yes($question) { if ($DryRun) { return $true }; $a = Read-Host "      $question [C/k]"; return ($a -eq '' -or $a -match '^[cCyY]') }
function Update-Path { $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User') }
# chay chuong trinh va lay ket qua, khong de dong loi cua no lam dung bo cai
function Invoke-Quiet($exe, [string[]]$list) {
  $old = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
  try { $out = (& $exe @list 2>&1 | Out-String); return @{ ok = ($LASTEXITCODE -eq 0); out = $out.Trim() } }
  catch { return @{ ok = $false; out = $_.Exception.Message } }
  finally { $ErrorActionPreference = $old }
}
function Find-Python {
  $list = @()
  foreach ($v in '312', '313', '311', '310') { $list += "$env:LOCALAPPDATA\Programs\Python\Python$v\python.exe"; $list += "$env:ProgramFiles\Python$v\python.exe" }
  $cmd = Get-Command python.exe -ErrorAction SilentlyContinue
  if ($cmd -and $cmd.Source -notmatch 'WindowsApps') { $list += $cmd.Source }
  foreach ($p in $list) {
    if (Test-Path $p) { $r = Invoke-Quiet $p @('-c', 'import sys; print(int((3,9) <= sys.version_info[:2] <= (3,13) and sys.maxsize > 2**32))'); if ($r.ok -and $r.out -eq '1') { return $p } }
  }
  return $null
}
function Find-Node {
  $list = @(); $cmd = Get-Command node.exe -ErrorAction SilentlyContinue
  if ($cmd) { $list += $cmd.Source }; $list += "$env:ProgramFiles\nodejs\node.exe"
  foreach ($p in $list) { if (Test-Path $p) { $r = Invoke-Quiet $p @('--version'); if ($r.ok -and $r.out -match '^v(\d+)' -and [int]$Matches[1] -ge 22) { return $p } } }
  return $null
}
function Install-Tool($id, $name, $page) {
  $winget = Get-Command winget.exe -ErrorAction SilentlyContinue
  if (-not $winget) { Write-Warn "May nay chua co winget. Tai va cai $name tu $page roi chay lai bo cai."; return }
  Write-Info "Cai $name bang winget (neu winget hoi dong y dieu khoan, ban tu tra loi)."
  if (-not $DryRun) { & $winget.Source install --exact --id $id --source winget; Update-Path }
}
function Find-Terminal {
  $running = Get-Process terminal64 -ErrorAction SilentlyContinue | Where-Object { $_.Path } | Select-Object -First 1
  if ($running) { return $running.Path }
  foreach ($root in @($env:ProgramFiles, ${env:ProgramFiles(x86)})) {
    if ($root) { $f = Get-ChildItem -Path (Join-Path $root '*\terminal64.exe') -ErrorAction SilentlyContinue | Sort-Object { $_.FullName -notmatch 'MetaTrader' } | Select-Object -First 1; if ($f) { return $f.FullName } }
  }
  return $null
}
function New-Link($path, $target, $folder, $minimized) {
  if ($DryRun) { Write-Info "(thu) se tao loi tat: $path"; return }
  $s = (New-Object -ComObject WScript.Shell).CreateShortcut($path); $s.TargetPath = $target; $s.WorkingDirectory = $folder; if ($minimized) { $s.WindowStyle = 7 }; $s.Save()
}
function Test-Port($port) { return [bool](Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue) }

Write-Host "ICT - cai dat tren may nay ($env:COMPUTERNAME). Ma o: $App"
if (-not (Test-Path (Join-Path $App 'local\mt5_server.py'))) { Write-Warn 'Thieu ma nguon. Chay lai ICT-CaiDat-MayMoi.bat.'; exit 1 }
if (-not $DryRun) { New-Item -ItemType Directory -Force $Cfg | Out-Null }

Write-Step 1 'Python'
$py = Find-Python
if (-not $py) { Install-Tool 'Python.Python.3.12' 'Python 3.12' 'https://www.python.org/downloads/'; $py = Find-Python }
if (-not $py) { Write-Warn 'Chua co Python 3.9-3.13 (64 bit). Cai xong thi chay lai bo cai.'; exit 1 }
Write-Info "Dung: $py"
if (-not $DryRun) { [IO.File]::WriteAllText((Join-Path $Cfg 'python.txt'), $py, (New-Object Text.UTF8Encoding($false))) }

Write-Step 2 'Node.js (ban 22 tro len)'
$node = Find-Node
if (-not $node) { Install-Tool 'OpenJS.NodeJS.LTS' 'Node.js LTS' 'https://nodejs.org'; $node = Find-Node }
if (-not $node) { Write-Warn 'Chua co Node.js. Cai xong thi chay lai bo cai.'; exit 1 }
Write-Info "Dung: $node"
$env:Path = (Split-Path -Parent $node) + ';' + $env:Path

Write-Step 3 'Goi doc gia MetaTrader5 cho Python'
if ((Invoke-Quiet $py @('-c', 'import MetaTrader5')).ok) { Write-Info 'Da co.' }
else {
  Write-Info 'Dang cai (pip install MetaTrader5)...'
  if (-not $DryRun) { & $py -m pip install --upgrade MetaTrader5; if (-not (Invoke-Quiet $py @('-c', 'import MetaTrader5')).ok) { Write-Warn 'Khong cai duoc goi MetaTrader5. Kiem tra mang roi chay lai.'; exit 1 } }
}

Write-Step 4 'MetaTrader 5'
$mt5 = Find-Terminal
if (-not $mt5) { Write-Warn 'Chua thay MetaTrader 5. Cai tu trang cua san cua ban, dang nhap, roi chay lai bo cai de them tu chay.' }
else {
  Write-Info "Thay: $mt5"
  if (-not (Get-Process terminal64 -ErrorAction SilentlyContinue)) { if (-not $DryRun) { Start-Process $mt5 } }
  Wait-User 'Dang nhap MT5 (nho luu mat khau de lan sau tu dang nhap)'
}

Write-Step 5 'Telegram (dung chung mot bot cho moi may)'
$file = Join-Path $Cfg 'config.env'
$brought = if ($env:ICT_FROM) { Join-Path $env:ICT_FROM 'config.env' } else { $null }
if ($DryRun) { Write-Info "(thu) tep khoa: $file, da co: $(Test-Path $file)" }
else {
  if ($brought -and (Test-Path $brought) -and -not (Test-Path $file)) { Copy-Item $brought $file; Write-Info 'Da lay config.env dat canh bo cai. Nho xoa ban sao do (USB, thu muc tai ve).' }
  $sender = Join-Path $App 'local\telegram.js'
  $ok = $false
  if (Test-Path $file) { & $node $sender --test; $ok = ($LASTEXITCODE -eq 0) }
  for ($i = 1; $i -le 3 -and -not $ok; $i++) {
    & $node $sender --init | Out-Null
    Start-Process notepad $file
    Write-Info 'Trong Notepad: dien token sau TG_BOT_TOKEN= va so chat id sau TG_CHAT_ID= (giong may cu).'
    Wait-User 'Bam Ctrl+S de luu'
    & $node $sender --test; $ok = ($LASTEXITCODE -eq 0)
  }
  if (-not $ok) { Write-Warn 'Chua gui duoc tin Telegram. Chay local\ICT-Telegram-CaiDat.bat de sua sau.' }
}

Write-Step 6 'Loi tat va tu chay'
$desk = [Environment]::GetFolderPath('Desktop'); $start = [Environment]::GetFolderPath('Startup')
New-Link (Join-Path $desk 'ICT Local.lnk') $Local (Join-Path $App 'local') $false
if (Read-Yes 'Tu chay khi dang nhap Windows (MT5, ICT Local va bo gui tin)?') {
  $auto = Join-Path $Cfg 'tu-chay.cmd'
  # ghi bang bien %LOCALAPPDATA% de ten nguoi dung co dau khong lam hong duong dan
  $target = $Local; if ($target.StartsWith($env:LOCALAPPDATA, [StringComparison]::OrdinalIgnoreCase)) { $target = '%LOCALAPPDATA%' + $target.Substring($env:LOCALAPPDATA.Length) }
  $lines = @(
    '@echo off',
    'rem Tu chay ICT Local khi dang nhap Windows. Muon tat: xoa loi tat "ICT Local (MT5 + Telegram)" trong shell:startup.',
    'title ICT - dang khoi dong',
    "set `"BAT=$target`"",
    'set /a N=0',
    ':cho',
    'if exist "%BAT%" goto chay',
    'set /a N+=1',
    'if %N% geq 120 goto thieu',
    'ping -n 6 127.0.0.1 >nul',
    'goto cho',
    ':chay',
    'call "%BAT%"',
    'exit /b',
    ':thieu',
    'echo Khong thay "%BAT%" sau 10 phut. Chay lai bo cai.',
    'pause',
    'exit /b 1'
  )
  if (-not $DryRun) { Set-Content -Path $auto -Value $lines -Encoding Default }
  New-Link (Join-Path $start 'ICT Local (MT5 + Telegram).lnk') $auto $Cfg $true
  if ($mt5) { New-Link (Join-Path $start 'ICT - MetaTrader 5.lnk') $mt5 (Split-Path -Parent $mt5) $false }
}

Write-Host ''
if ((Test-Port 8765) -or (Test-Port 8798)) { Write-Info 'ICT Local hoac bo gui tin dang chay: dong cac cua so do roi mo lai "ICT Local" de dung ban vua cai.' }
elseif (-not $DryRun) { Start-Process $Local }
Write-Host 'Xong.' -ForegroundColor Green
Write-Info 'Nhieu may dung chung bot: moi luc chi mot may gui tin; may khac dung cho va tu nhan sau khoang 12 phut neu may do ngung.'
