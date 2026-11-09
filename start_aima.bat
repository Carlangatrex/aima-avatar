@echo off
echo Iniciando Interfaz Web de AIMA (Puerto 8000)...
start python -m http.server 8000

echo Iniciando Cerebro Local Llama 3 (Puerto 8080)...
cd /d "%~dp0"
start .\llama.cpp\build\bin\Release\llama-server.exe -m .\model\Meta-Llama-3-8B-Instruct-Q4_K_M.gguf --port 8080 -c 2048 --no-warmup

echo.
echo ==================================================================
echo                      AIMA ESTA ACTIVA
echo ==================================================================
echo 1. Se acaba de abrir una ventana que mantendra vivo el Cerebro Local.
echo    (Dejala abierta y minimizada mientras uses AIMA).
echo 2. Abre tu navegador de internet y entra a:
echo    http://localhost:8000
echo ==================================================================
pause
