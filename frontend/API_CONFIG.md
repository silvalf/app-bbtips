# Configuração de URLs (Axios e WebSocket)

## Resumo

O frontend está configurado para apontar para o backend via variáveis de ambiente. Todas as requisições e conexões WebSocket utilizam a URL base definida em `REACT_APP_BACKEND_URL`.

## Arquivos de Configuração

### `.env` (raiz do `frontend/`)
```dotenv
REACT_APP_BACKEND_URL=http://127.0.0.1:8000
WDS_SOCKET_PORT=3003
WDS_SOCKET_HOST=localhost
WDS_SOCKET_PROTOCOL=ws
ENABLE_HEALTH_CHECK=false
```

**Significado:**
- `REACT_APP_BACKEND_URL`: URL base do servidor backend (inclui protocolo e porta)
- `WDS_SOCKET_PORT`: Porta usada pelo cliente HMR (hot-reload) do webpack
- `WDS_SOCKET_HOST`: Host do cliente HMR
- `WDS_SOCKET_PROTOCOL`: Protocolo do cliente HMR (`ws` ou `wss`)

## Como Ajustar para Diferentes Portas/Hosts

### Cenário 1: Backend rodando em `http://localhost:3005`
Edite `.env`:
```dotenv
REACT_APP_BACKEND_URL=http://localhost:3005
```

### Cenário 2: Backend remoto com HTTPS
Edite `.env`:
```dotenv
REACT_APP_BACKEND_URL=https://api.example.com
```

### Cenário 3: WebSocket com TLS/HTTPS
Edite `.env`:
```dotenv
REACT_APP_BACKEND_URL=https://api.example.com
WDS_SOCKET_PROTOCOL=wss
WDS_SOCKET_PORT=443
```

## Uso no Código

### Axios (HTTP)
```javascript
import api from '@/lib/api';

// GET
const response = await api.get('/status');

// POST
const result = await api.post('/status', { client_name: 'MyClient' });
```

### WebSocket
```javascript
import { createClientWebSocket } from '@/lib/WebSocketClient';

// Conexão padrão
const ws = createClientWebSocket('/ws');

// Conexão com TLS (se backend usar HTTPS)
const secureWs = createClientWebSocket('/ws', { forceSecure: true });

// Conexão com porta customizada
const customWs = createClientWebSocket('/ws', { port: 8080 });
```

## Verificação de Status

Acesse a página **Home** (`/`) para ver o status dos servidores em tempo real:
- **Backend**: conectado ou desconectado (verifica a cada 5s)
- **Frontend**: sempre online (já que está rodando)

## Reiniciar o Dev Server

Após editar `.env`, reinicie o dev server:
```powershell
npm start
```

Ou com variáveis de ambiente inline:
```powershell
$env:WDS_SOCKET_PORT='3003'; npm start
```

## Troubleshooting

### Erro: "Access to XMLHttpRequest ... blocked by CORS"
- Verifique se `REACT_APP_BACKEND_URL` aponta para o mesmo servidor do backend
- Verifique se o backend tem CORS configurado (se remoto)
- Teste: `curl http://backend-url/api/`

### Erro: "WebSocket connection failed"
- Verifique se `WDS_SOCKET_HOST` e `WDS_SOCKET_PORT` correspondem ao dev server
- Se usar HTTPS, defina `WDS_SOCKET_PROTOCOL=wss`
- Reinicie o dev server após mudar `.env`

### Backend offline
- Verifique se o backend está rodando
- Teste: `curl http://127.0.0.1:8000/api/`
- Se offline, veja o status na página Home
