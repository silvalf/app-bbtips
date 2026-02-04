# BBTips App - Instruções de Execução

## 🌐 Ambiente de Preview (Emergent)

Se você está vendo este projeto no ambiente Emergent, ele já está configurado e funcionando. Basta clicar nos links do menu para navegar entre as páginas.

---

## 🖥️ Como Rodar Localmente (Windows)

### Pré-requisitos
- **Python 3.11+** instalado
- **Node.js 18+** instalado
- **MongoDB** (opcional, para persistência de dados)

### Passo 1: Configurar o Frontend

1. Navegue até a pasta `frontend`
2. **Copie o arquivo de configuração local:**
```powershell
cd frontend
copy .env.local.example .env.local
```

3. Instale as dependências:
```powershell
npm install
# ou
yarn install
```

### Passo 2: Configurar o Backend

1. Navegue até a pasta `backend`
2. Crie e ative o virtual environment:
```powershell
cd backend
python -m venv .venv311
.\.venv311\Scripts\Activate.ps1
pip install -r requirements.txt
```

3. Configure o arquivo `.env` do backend (se necessário):
```dotenv
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"
```

### Passo 3: Iniciar os Serviços

#### Terminal 1 - Backend (FastAPI)
```powershell
cd backend
.\.venv311\Scripts\Activate.ps1
python -m uvicorn server:app --reload --host 127.0.0.1 --port 8000
```
O backend estará em: **http://127.0.0.1:8000**

#### Terminal 2 - Frontend (React)
```powershell
cd frontend
npm start
# ou
yarn start
```
O frontend estará em: **http://localhost:3000**

---

## ⚙️ Configuração de Ambiente

### Detecção Automática
O aplicativo detecta automaticamente o ambiente:
- **Localhost**: Usa `http://127.0.0.1:8000` como backend
- **Preview/Produção**: Usa a URL configurada em `REACT_APP_BACKEND_URL`

### Arquivos de Configuração

| Arquivo | Uso |
|---------|-----|
| `frontend/.env` | Configuração padrão (preview/produção) |
| `frontend/.env.local` | Configuração local (tem prioridade) |
| `frontend/.env.local.example` | Template para criar .env.local |
| `backend/.env` | Configuração do backend |

---

## 📂 Estrutura do Projeto

```
app-bbtips/
├── backend/                    # FastAPI + Python
│   ├── .venv311/              # Virtual environment (Python 3.11)
│   ├── server.py              # Servidor principal
│   └── requirements.txt        # Dependências Python
│
├── frontend/                   # React
│   ├── .env                    # Variáveis de ambiente
│   ├── src/
│   │   ├── App.js             # Roteador principal
│   │   ├── lib/
│   │   │   ├── api.js         # Axios centralizado
│   │   │   ├── WebSocketClient.js  # Helper WebSocket
│   │   │   └── ws.js          # WebSocket legado
│   │   └── hooks/
│   │       └── useServerStatus.js  # Status dos servidores
│   └── package.json           # Dependências Node.js
│
└── BBTipsManager/             # Aplicativo MAUI (.NET)
    └── BBTipsManager.App/     # Páginas XAML/C#
```

---

## 🔗 URLs Principais

| Serviço | URL | Descrição |
|---------|-----|-----------|
| Frontend | http://localhost:3000+ | Aplicação React |
| Backend API | http://127.0.0.1:8000/api | Endpoints FastAPI |
| Backend Root | http://127.0.0.1:8000 | Raiz do servidor |

---

## 📝 Rotas do Frontend

| Rota | Descrição |
|------|-----------|
| `/` | Home (com status dos servidores) |
| `/dashboard` | Dashboard |
| `/bancas` | Lista de Bancas |
| `/banca/:id` | Detalhe de uma Banca |
| `/padroes` | Padrões |
| `/simulador` | Simulador |
| `/configuracoes` | Configurações |

---

## 🛠️ Troubleshooting

### Erro: "Backend offline"
- Verifique se o backend está rodando em outro PowerShell
- Teste: `curl http://127.0.0.1:8000/api/`

### Erro: "CORS policy"
- Verifique `REACT_APP_BACKEND_URL` em `frontend/.env`
- Deve apontar para o mesmo host/porta do backend

### Erro: "WebSocket connection failed"
- Verifique se o dev server está rodando
- Reinicie com `npm start`

### Node/npm não encontrado
- Abra um novo PowerShell (para recarregar PATH)
- Ou reinstale Node.js via: `winget install OpenJS.NodeJS.LTS`

---

## 📚 Documentação Adicional

- [frontend/API_CONFIG.md](./frontend/API_CONFIG.md) — Configuração detalhada de Axios e WebSocket
- `backend/server.py` — Endpoints da API
- `frontend/src/App.js` — Roteador principal

---

## 🎯 Resumo Rápido

**Próxima execução:**
```powershell
# Terminal 1 (Backend)
cd backend
.\.venv311\Scripts\Activate.ps1
python -m uvicorn server:app --reload --host 127.0.0.1 --port 8000

# Terminal 2 (Frontend)
cd frontend
$env:PATH = 'C:\Program Files\nodejs;' + $env:PATH
npm start
```

Abra **http://localhost:3000** e divirta-se! 🚀

