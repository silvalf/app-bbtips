# Script para iniciar todos os serviços do BB Tips
# Inclui Backend (.NET) e Frontend (Angular)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  BB Tips - Inicializando Serviços" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Caminhos
$backendPath = "$PSScriptRoot\src\api\BBTips.Api"
$frontendPath = "$PSScriptRoot\src\web"

# Verificar se o backend existe
if (Test-Path $backendPath) {
    Write-Host "[1/2] Iniciando Backend .NET..." -ForegroundColor Yellow
    cd $backendPath
    dotnet run --urls "http://localhost:5000"
} else {
    Write-Host "Backend não encontrado em: $backendPath" -ForegroundColor Red
}

# Verificar se o frontend existe
if (Test-Path $frontendPath) {
    Write-Host "[2/2] Iniciando Frontend Angular..." -ForegroundColor Yellow
    cd $frontendPath
    npm start
} else {
    Write-Host "Frontend não encontrado em: $frontendPath" -ForegroundColor Red
}
