# BBTips App - Instruções de Execução

## 🚀 Como Rodar o Projeto

### Opção 1: Iniciar Manualmente (Recomendado)

#### Backend (FastAPI + Python 3.11)

1. Abra um **novo PowerShell** e execute:
```powershell
cd c:\Users\luizs\OneDrive\Documentos\GitHub\app-bbtips\backend
.\.venv311\Scripts\Activate.ps1
python -m uvicorn server:app --reload --host 127.0.0.1 --port 8000
```

O backend estará em: **http://127.0.0.1:8000**

#### Frontend (React + Node.js)

2. Abra um **segundo PowerShell** e execute:
```powershell
cd c:\Users\luizs\OneDrive\Documentos\GitHub\app-bbtips\frontend
$env:PATH = 'C:\Program Files\nodejs;' + $env:PATH
npm start
```

O frontend estará em: **http://localhost:3000** (ou próxima porta disponível)

---

### Opção 2: Usar Script de Inicialização (Automático)

1. Na raiz do projeto, execute:
```powershell
.\start-servers.ps1
```

Isso abrirá **duas janelas PowerShell** automaticamente:
- Uma com o backend rodando
- Uma com o frontend rodando

---

## 📋 Verificação de Status

Acesse **http://localhost:3000** (ou a porta exibida) e vá para a página **Home**. Você verá:
- **Backend Status**: Verde (online) ou Vermelho (offline)
- **Frontend Status**: Verde (sempre online)

---

## 🔧 Configuração

### Mudar a Porta do Backend

Edite `frontend/.env`:
```dotenv
REACT_APP_BACKEND_URL=http://127.0.0.1:8000  # ajuste aqui
```

Depois reinicie o frontend.

### Mudar a Porta do Frontend

O frontend automaticamente usa a próxima porta disponível se 3000 estiver ocupada.

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

