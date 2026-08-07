@echo off
title Portal Suplevet - Servidor local
cd /d "%~dp0"

echo.
echo   ==============================================
echo      PORTAL SUPLEVET - Servidor local
echo   ==============================================
echo.
echo   El portal no funciona abriendo index.html con
echo   doble clic. Necesita un servidor real. Esto lo
echo   levanta y abre el navegador solo.
echo.

REM ---- Node es el preferido: replica las cabeceras de produccion ----
where node >nul 2>&1
if %errorlevel%==0 goto usar_node

REM ---- Respaldo: Python ----
where python >nul 2>&1
if %errorlevel%==0 goto usar_python

where py >nul 2>&1
if %errorlevel%==0 goto usar_py

goto sin_motor


:usar_node
echo   Iniciando...
echo.
node "tools\servidor.js" 8080
goto fin


:usar_python
echo   Iniciando con Python...
echo.
echo   Portal Suplevet listo
echo   http://localhost:8080/
echo.
echo   Cierra esta ventana para detener el servidor.
echo.
timeout /t 2 /nobreak >nul
start "" "http://localhost:8080/"
python -m http.server 8080 --bind 127.0.0.1
goto fin


:usar_py
echo   Iniciando con Python...
echo.
echo   Portal Suplevet listo
echo   http://localhost:8080/
echo.
echo   Cierra esta ventana para detener el servidor.
echo.
timeout /t 2 /nobreak >nul
start "" "http://localhost:8080/"
py -m http.server 8080 --bind 127.0.0.1
goto fin


:sin_motor
echo.
echo   No encontramos Node.js ni Python en este equipo.
echo.
echo   Instala cualquiera de los dos y vuelve a ejecutar
echo   este archivo:
echo.
echo      Node.js  --^>  https://nodejs.org
echo      Python   --^>  https://python.org/downloads
echo                     (marca "Add Python to PATH")
echo.
pause
goto :eof


:fin
echo.
echo   El servidor se detuvo.
echo.
pause
