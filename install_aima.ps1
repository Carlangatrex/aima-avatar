# ------------------------------------------------------------
# install_aima.ps1 – Instalación local de AIMA (Windows 10)
# ------------------------------------------------------------
# 1️⃣  Verificar que existan los programas requeridos
function Command-Exists($cmd) {
  $null -ne (Get-Command $cmd -ErrorAction SilentlyContinue)
}

$prereqs = @('git', 'cmake')   # git y cmake (CMake encontrará el compilador MSVC automáticamente)
foreach ($p in $prereqs) {
  if (-not (Command-Exists $p)) {
    Write-Host "[ERROR] $p no está instalado o no está en el PATH. Instálalo antes de continuar." -ForegroundColor Red
    exit 1
  }
}

# 2️⃣  Definir la carpeta base (donde está este script)
$BaseDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $BaseDir
Write-Host "Carpeta de trabajo: $BaseDir"

# -----------------------------------------------------------------
# 3️⃣  Clonar (o actualizar) el repositorio llama.cpp
# -----------------------------------------------------------------
if (-not (Test-Path "llama.cpp")) {
  Write-Host "Clonando llama.cpp..."
  git clone https://github.com/ggerganov/llama.cpp.git
}
else {
  Write-Host "Repositorio llama.cpp ya existe – actualizando..."
  Push-Location "llama.cpp"
  git pull
  Pop-Location
}

# -----------------------------------------------------------------
# 4️⃣  Compilar llama.cpp (modo Release)
# -----------------------------------------------------------------
Push-Location "llama.cpp"
if (-not (Test-Path "build")) { New-Item -ItemType Directory -Path "build" }
Set-Location "build"

Write-Host "Generando archivos de proyecto con CMake..."
cmake .. -G "Visual Studio 17 2022" -A x64 `
  -DLLAMA_BUILD_EXAMPLES=ON `
  -DLLAMA_BUILD_SERVER=ON `
  -DCMAKE_BUILD_TYPE=Release

Write-Host "Compilando (puede tardar varios minutos)..."
cmake --build . --config Release -- /m
Pop-Location

# -----------------------------------------------------------------
# 5️⃣  Descargar modelo GGML (llama‑3‑8b‑q4_0.ggml ~4 GB)
# -----------------------------------------------------------------
$ModelDir = Join-Path $BaseDir "model"
if (-not (Test-Path $ModelDir)) { New-Item -ItemType Directory -Path $ModelDir }

$ModelFile = Join-Path $ModelDir "llama-3-8b-q4_0.ggml"
if (-not (Test-Path $ModelFile)) {
  Write-Host "Descargando modelo GGML (≈ 4 GB)…"
  $url = "https://huggingface.co/ggerganov/llama.cpp/resolve/main/ggml-models/llama-3-8b-q4_0.ggml"
  Invoke-WebRequest -Uri $url -OutFile $ModelFile
}
else {
  Write-Host "Modelo ya está presente en $ModelFile"
}

# -----------------------------------------------------------------
# 6️⃣  Copiar el binario al lugar que AIMA espera
# -----------------------------------------------------------------
$ExeSrc = Join-Path $BaseDir "llama.cpp\build\bin\Release\llama-cli.exe"
$ExeDstDir = Join-Path $BaseDir "build\bin\Release"
if (-not (Test-Path $ExeDstDir)) { New-Item -ItemType Directory -Path $ExeDstDir }

Copy-Item -Path $ExeSrc -Destination $ExeDstDir -Force
Write-Host "Ejecutable copiado a $ExeDstDir"

# -----------------------------------------------------------------
# 7️⃣  Instalar dependencias Node (si tienes package.json)
# -----------------------------------------------------------------
if (Test-Path "$BaseDir\package.json") {
  Write-Host "Instalando dependencias Node (npm install)…"
  npm install
}
else {
  Write-Host "No se encontró package.json – se asume que no hay dependencias Node que instalar."
}

# -----------------------------------------------------------------
# 8️⃣  Lanzar el servidor web estático (Python)
# -----------------------------------------------------------------
Write-Host "Iniciando servidor HTTP local en http://localhost:8000 ..."
python -m http.server 8000

# ------------------------------------------------------------
# FIN del script
# ------------------------------------------------------------