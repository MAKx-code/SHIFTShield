
@echo off
cd /d "%~dp0"

echo Starting SHIFTShield...

start "SHIFTShield Backend" powershell -NoExit -ExecutionPolicy Bypass -Command "Set-Location '%~dp0backend'; .\venv\Scripts\Activate.ps1; python -m uvicorn app.main:app --reload --port 8000"

start "SHIFTShield Frontend" powershell -NoExit -Command "Set-Location '%~dp0frontend'; npm.cmd run dev"

timeout /t 5 /nobreak >nul
start "" "http://localhost:5173"
