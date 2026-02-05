# Script de inicializacao automatica para BBTips App
# Abre duas janelas PowerShell: uma para backend, outra para frontend
# E abre o navegador na pagina do frontend

$backendPath = "c:\Users\luizs\OneDrive\Documentos\GitHub\app-bbtips\backend"
$frontendPath = "c:\Users\luizs\OneDrive\Documentos\GitHub\app-bbtips\frontend"

Write-Host "BBTips App iniciado!" -ForegroundColor Green

# Iniciar Backend em nova janela
Write-Host "Iniciando Backend (FastAPI)..." -ForegroundColor Cyan
$backendScript = "Set-Location '$backendPath'; .\.venv311\Scripts\Activate.ps1; Write-Host 'Backend iniciando em http://127.0.0.1:8000' -ForegroundColor Green; python -m uvicorn server:app --reload --host 127.0.0.1 --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $backendScript

# Aguardar um pouco para o backend iniciar
Start-Sleep -Seconds 2

# Iniciar Frontend em nova janela
Write-Host "Iniciando Frontend (React)..." -ForegroundColor Cyan
$frontendScript = "Set-Location '$frontendPath'; `$env:PATH = 'C:\Program Files\nodejs;' + `$env:PATH; Write-Host 'Frontend iniciando em http://localhost:3000' -ForegroundColor Green; npm start"
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $frontendScript

# Aguardar um pouco para o frontend iniciar
Start-Sleep -Seconds 5

# Abrir navegador na pagina do frontend
Write-Host "Abrindo navegador..." -ForegroundColor Cyan
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "Servidores iniciados!" -ForegroundColor Green
Write-Host "Backend:  http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Dica: Verifique o status dos servidores na pagina Home" -ForegroundColor Magenta
