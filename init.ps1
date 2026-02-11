#!/usr/bin/env pwsh
# ============================================
# BB Tips - Script de Inicializacao dos Servicos
# ============================================

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BB Tips - Inicializacao dos Servicos" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Obter o caminho completo do diretorio atual
$CurrentDir = (Get-Location).Path
Write-Host "Diretorio atual: $CurrentDir" -ForegroundColor Gray

# Verificar estrutura de pastas
$RobotPath = Join-Path $CurrentDir "src\robot"
$ApiPath = Join-Path $CurrentDir "src\api\BBTips.Api"
$WebPath = Join-Path $CurrentDir "src\web"

if (-not (Test-Path $RobotPath)) {
    Write-Host "ERRO: Diretorio do Robot nao encontrado: $RobotPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $ApiPath)) {
    Write-Host "ERRO: Diretorio da API nao encontrado: $ApiPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $WebPath)) {
    Write-Host "ERRO: Diretorio do Web nao encontrado: $WebPath" -ForegroundColor Red
    exit 1
}

# ============================================
# 1. Instalar dependencias do Robot (Node.js)
# ============================================
Write-Host ""
Write-Host "[1/5] Instalando dependencias do Robot..." -ForegroundColor Yellow
Set-Location $RobotPath
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao instalar dependencias do Robot" -ForegroundColor Red
}
Write-Host "OK" -ForegroundColor Green

# ============================================
# 2. Buildar API .NET
# ============================================
Write-Host ""
Write-Host "[2/5] Buildando API .NET..." -ForegroundColor Yellow
Set-Location $ApiPath
dotnet build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao buildar API .NET" -ForegroundColor Red
}
Write-Host "OK" -ForegroundColor Green

# ============================================
# 3. Instalar dependencias do Frontend Angular
# ============================================
Write-Host ""
Write-Host "[3/5] Instalando dependencias do Frontend..." -ForegroundColor Yellow
Set-Location $WebPath
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao instalar dependencias do Frontend" -ForegroundColor Red
}
Write-Host "OK" -ForegroundColor Green

# ============================================
# 4. Iniciar API do Robot (Porta 3001) em janela separada
# ============================================
Write-Host ""
Write-Host "[4/6] Iniciando API do Robot (porta 3001)..." -ForegroundColor Yellow

# Criar pasta de logs se não existir
$RobotLogsDir = Join-Path $RobotPath "logs"
if (-not (Test-Path $RobotLogsDir)) {
    New-Item -ItemType Directory -Force -Path $RobotLogsDir | Out-Null
}

# Iniciar em nova janela (sem redirecionamento para ver erros)
$RobotApiProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run start:api" -WindowStyle Normal -WorkingDirectory $RobotPath -PassThru
Write-Host "OK (PID: $($RobotApiProcess.Id))" -ForegroundColor Green

# Aguardar e verificar se a API do Robot iniciou corretamente
Write-Host "Aguardando API do Robot iniciar..." -ForegroundColor Gray
$RobotApiReady = $false
$RobotApiRetries = 0
while (-not $RobotApiReady -and $RobotApiRetries -lt 5) {
    Start-Sleep -Seconds 5
    $RobotApiRetries++
    try {
        $Response = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($Response.StatusCode -eq 200) {
            $RobotApiReady = $true
            Write-Host "API do Robot esta pronta!" -ForegroundColor Green
        }
    } catch {
        Write-Host "Aguardando API do Robot... ($RobotApiRetries/5)" -ForegroundColor Gray
    }
}

if (-not $RobotApiReady) {
    Write-Host "AVISO: API do Robot nao respondeu em 60 segundos, continuando..." -ForegroundColor Yellow
}

# ============================================
# 5. Iniciar API .NET (Porta 5000) em janela separada
# ============================================
Write-Host ""
Write-Host "[5/6] Iniciando API .NET (porta 5000)..." -ForegroundColor Yellow
$ApiProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "dotnet run --urls http://localhost:5000" -WindowStyle Normal -WorkingDirectory $ApiPath -PassThru
Write-Host "OK (PID: $($ApiProcess.Id))" -ForegroundColor Green

# Aguardar
Write-Host "Aguardando API .NET iniciar..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# ============================================
# 6. Iniciar Frontend Angular (Porta 3000) em janela separada
# ============================================
Write-Host ""
Write-Host "[6/6] Iniciando Frontend Angular (porta 3000)..." -ForegroundColor Yellow
$AngularProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm start -- --port 3000 --host 0.0.0.0" -WindowStyle Normal -WorkingDirectory $WebPath -PassThru
Write-Host "OK (PID: $($AngularProcess.Id))" -ForegroundColor Green

# Aguardar Angular iniciar
Write-Host "Aguardando Angular iniciar..." -ForegroundColor Gray
Start-Sleep -Seconds 15

# ============================================
# Abrir browser na pagina home
# ============================================
Write-Host ""
Write-Host "Abrindo browser..." -ForegroundColor Yellow
Start-Process "http://localhost:3000"

# ============================================
# Resumo
# ============================================
Set-Location $CurrentDir
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Todos os servicos iniciados!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para usar:" -ForegroundColor White
Write-Host "   Acesse: http://localhost:3000/simulador" -ForegroundColor Green
Write-Host "   Clique em INICIAR para rodar o robo (VISIVEL)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Servicos:" -ForegroundColor White
Write-Host "   API Robot: http://localhost:3001 (PID: $($RobotApiProcess.Id))" -ForegroundColor Gray
Write-Host "   API .NET:  http://localhost:5000 (PID: $($ApiProcess.Id))" -ForegroundColor Gray
Write-Host "   Angular:   http://localhost:3000 (PID: $($AngularProcess.Id))" -ForegroundColor Gray
Write-Host ""
Write-Host "Para parar: Get-Process -Id $($RobotApiProcess.Id), $($ApiProcess.Id), $($AngularProcess.Id) | Stop-Process" -ForegroundColor Yellow
Write-Host ""
Write-Host "Pressione Enter para sair..." -ForegroundColor Gray
Read-Host
