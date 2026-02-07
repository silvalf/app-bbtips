#!/bin/bash
# ============================================
# BB Tips - Script de Inicializacao dos Servicos
# ============================================

set -e

echo "========================================"
echo "  BB Tips - Inicializacao dos Servicos"
echo "========================================"

# Obter o diretorio atual
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Diretorio: $SCRIPT_DIR"

# Verificar estrutura de pastas
for dir in "src/robot" "src/api/BBTips.Api" "src/web"; do
    if [ ! -d "$SCRIPT_DIR/$dir" ]; then
        echo "ERRO: Diretorio nao encontrado: $SCRIPT_DIR/$dir"
        exit 1
    fi
done

# ============================================
# 1. Instalar dependencias do Robot
# ============================================
echo ""
echo "[1/5] Instalando dependencias do Robot..."
npm install --prefix "$SCRIPT_DIR/src/robot"
echo "OK"

# ============================================
# 2. Buildar API .NET
# ============================================
echo ""
echo "[2/5] Buildando API .NET..."
dotnet build "$SCRIPT_DIR/src/api/BBTips.Api/BBTips.Api.csproj"
echo "OK"

# ============================================
# 3. Instalar dependencias do Frontend
# ============================================
echo ""
echo "[3/5] Instalando dependencias do Frontend..."
npm install --prefix "$SCRIPT_DIR/src/web"
echo "OK"

# ============================================
# 4. Iniciar API do Robot (Porta 3001)
# ============================================
echo ""
echo "[4/5] Iniciando API do Robot (porta 3001)..."
npm run start:api --prefix "$SCRIPT_DIR/src/robot" > /tmp/robot-api.log 2>&1 &
ROBOT_API_PID=$!
echo "OK (PID: $ROBOT_API_PID)"

sleep 3

# ============================================
# 5. Iniciar API .NET (Porta 5000)
# ============================================
echo ""
echo "[5/5] Iniciando API .NET (porta 5000)..."
cd "$SCRIPT_DIR/src/api/BBTips.Api"
dotnet run --urls "http://localhost:5000" > /tmp/dotnet-api.log 2>&1 &
DOTNET_PID=$!
echo "OK (PID: $DOTNET_PID)"

sleep 5

# ============================================
# 6. Iniciar Frontend Angular (Porta 3000)
# ============================================
echo ""
echo "[6/6] Iniciando Frontend Angular (porta 3000)..."
cd "$SCRIPT_DIR/src/web"
npm start -- --port 3000 --host 0.0.0.0 > /tmp/angular-web.log 2>&1 &
ANGULAR_PID=$!
echo "OK (PID: $ANGULAR_PID)"

echo "Aguardando Angular iniciar..."
sleep 15

# ============================================
# Abrir browser
# ============================================
echo ""
echo "Abrindo browser..."
if command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:3000" &> /dev/null
elif command -v open &> /dev/null; then
    open "http://localhost:3000" &> /dev/null
else
    echo "Abra manualmente: http://localhost:3000/simulador"
fi

# ============================================
# Resumo
# ============================================
cd "$SCRIPT_DIR"
echo ""
echo "========================================"
echo "  Todos os servicos iniciados!"
echo "========================================"
echo ""
echo "Para usar:"
echo "   Acesse: http://localhost:3000/simulador"
echo "   Clique em INICIAR para rodar o robo (modo oculto)"
echo ""
echo "Processos:"
echo "   API Robot: $ROBOT_API_PID"
echo "   API .NET:  $DOTNET_PID"
echo "   Angular:   $ANGULAR_PID"
echo ""
echo "Para parar: kill $ROBOT_API_PID $DOTNET_PID $ANGULAR_PID"
echo ""

cleanup() {
    echo ""
    echo "Parando processos..."
    kill $ROBOT_API_PID 2>/dev/null || true
    kill $DOTNET_PID 2>/dev/null || true
    kill $ANGULAR_PID 2>/dev/null || true
    echo "OK"
    exit 0
}

trap cleanup INT
wait
