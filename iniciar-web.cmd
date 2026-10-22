@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Necesitas instalar Node.js 24 para ejecutar VoxTexto.
  pause
  exit /b 1
)
if not exist node_modules (
  call npm ci
  if errorlevel 1 (
    echo No se pudieron instalar las dependencias.
    pause
    exit /b 1
  )
)
echo.
echo VoxTexto estara disponible en http://127.0.0.1:1420
echo Cierra esta ventana para detener el servidor local.
echo.
call npm run dev
pause
