@echo off
title Server - MORPH
cd /d "%~dp0"
echo.
echo   MORPH  -  servidor local
echo   http://localhost:8080/portfolio/
echo.
echo   Cierra esta ventana para detener el servidor.
echo.
start "" "http://localhost:8080/portfolio/"
python -m http.server 8080
if errorlevel 1 (
  echo.
  echo   No se pudo iniciar el servidor. Si el puerto 8080 ya esta en uso, puede que ya este abierto en otra ventana.
  pause
)
