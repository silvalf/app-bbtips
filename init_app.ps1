# Script de inicialização automática para BB Tips App
# Inicia todos os serviços: Backend .NET, Frontend Angular
# E abre o navegador na página do frontend

$backendPath = "c:\Users\luizs\OneDrive\Documentos\GitHub\app-bbtips\src\api\BBTips.Api"
$frontendPath = "c:\Users\luizs\OneDrive\Documentos\GitHub\app-bbtips\src\web"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "      BB Tips App - Iniciando..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

# Parar processos anteriores
Write-Host "`n[1/4] Parando processos anteriores..." -ForegroundColor Yellow
Stop-Process -Name "dotnet" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Limpar bin/obj para evitar travamento
Write-Host "[2/4] Limpando cache de compilação..." -ForegroundColor Yellow
Remove-Item -Path "$backendPath\bin" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$backendPath\obj" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "    Cache limpo!" -ForegroundColor Green

# Iniciar Backend .NET
Write-Host "[3/4] Iniciando Backend (.NET)..." -ForegroundColor Yellow
$backendScript = "Set-Location '$backendPath'; Write-Host '    Backend rodando em http://localhost:5000' -ForegroundColor Green; dotnet run"
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $backendScript
Write-Host "    Aguardando backend iniciar..." -ForegroundColor Cyan
Start-Sleep -Seconds 8

# Iniciar Frontend Angular
Write-Host "[4/4] Iniciando Frontend (Angular)..." -ForegroundColor Yellow
$frontendScript = "Set-Location '$frontendPath'; npm start"
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $frontendScript
Write-Host "    Aguardando frontend iniciar..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Abrir navegador
Write-Host "`nAbrindo navegador..." -ForegroundColor Yellow
Start-Process "http://localhost:3000"

# Resumo
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "       Todos os serviços iniciados!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "  Acesse http://localhost:3000 para verificar" -ForegroundColor Magenta
Write-Host "  o status dos serviços na Home Page." -ForegroundColor Magenta
Write-Host ""
