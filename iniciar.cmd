@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Instala Node.js 24 para iniciar la sala.
 pause
 exit /b 1
)
if not defined MARTILLERO_CLAVE set /p "MARTILLERO_CLAVE=Elegi la clave privada del panel del martillero: "
if not defined MARTILLERO_CLAVE exit /b 1
node server.mjs
pause
