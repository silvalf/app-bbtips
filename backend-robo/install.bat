@echo off
echo ============================================
echo Instalação do Robô BB Tips (Puppeteer)
echo ============================================
echo.

REM Instalar dependências Node.js
echo 📦 Instalando dependências Node.js...
npm install

REM Instalar browser do Puppeteer
echo 🌐 Instalando browser do Puppeteer...
npx puppeteer browsers install chrome

echo.
echo ✅ Instalação concluída!
echo.
echo Para iniciar o robô, execute:
echo    npm start
echo.
pause
