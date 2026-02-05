@echo off
echo ============================================
echo    Instalador do Robo BB Tips
echo ============================================
echo.

echo [1/3] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado!
    echo Por favor, instale o Node.js em: https://nodejs.org/
    pause
    exit /b 1
)
echo OK - Node.js encontrado

echo.
echo [2/3] Instalando dependencias do projeto...
call npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias!
    pause
    exit /b 1
)
echo OK - Dependencias instaladas

echo.
echo [3/3] Instalando Chrome para Puppeteer...
call npx puppeteer browsers install chrome
if %errorlevel% neq 0 (
    echo AVISO: Nao foi possivel instalar Chrome automaticamente
    echo O Puppeteer tentara usar o Chrome do sistema
)
echo OK - Chrome configurado

echo.
echo ============================================
echo    Instalacao concluida com sucesso!
echo ============================================
echo.
echo Para executar o robo, digite:
echo    npm start
echo.
echo Ou:
echo    node robo.js
echo.
pause
