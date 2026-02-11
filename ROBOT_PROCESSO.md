# BB Tips Robot - Documentação do Processo

## Visão Geral

O BB Tips Robot é um automação em Puppeteer que acessa o site app.bbtips.com.br, busca padrões de apostas e salva os dados no banco de dados SQL Server.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                     BB Tips Robot                               │
├─────────────────────────────────────────────────────────────────┤
│  Frontend Angular (Porta 3000)                                 │
│     │                                                           │
│     ▼                                                           │
│  API do Robot (Porta 3001) - selenium-server.js               │
│     │                                                           │
│     ▼                                                           │
│  Robot Puppeteer - robotService.js                             │
│     │                                                           │
│     ▼                                                           │
│  API .NET (Porta 5000)                                        │
│     │                                                           │
│     ▼                                                           │
│  SQL Server - BBTipsDB                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Fluxo de Execução

### 1. Inicialização (`init.ps1`)

```
1. Instalar dependências do Robot (npm install)
2. Buildar API .NET (dotnet build)
3. Instalar dependências do Frontend (npm install)
4. Iniciar API do Robot (porta 3001)
5. Iniciar API .NET (porta 5000)
6. Iniciar Frontend Angular (porta 3000)
```

### 2. Iniciar Robot via Frontend

```
http://localhost:3000/simulador
   │
   ▼
Clique em "INICIAR"
   │
   ▼
Frontend → POST /api/robot/start
   │
   ▼
API Robot → Inicializa Puppeteer
```

### 3. Processo do Robot (`executarBuscadorPadroes`)

#### Passo 1: Login
```
1. Navegar para: http://localhost:3000/Bot
2. Clicar no botão de login
3. Preencher email e senha
4. Clicar em "Entrar"
```

#### Passo 2: Acessar Página de Bots
```
1. Navegar para: http://localhost:3000/Bot
2. Aguardar carregamento completo
```

#### Passo 3: Buscar Padrões
```
1. Clicar em "Buscar Padrões"
2. Configurar parâmetros:
   - Máximo Pulos: 80
   - Percentual Inicial: 94
   - Total Registros: 3
   - Stake Inicial: 10
   - Multiplicador: 3
3. Clicar em "Buscar"
```

> **Nota:** Os passos 4, 5 e 6 são executados PARA CADA uma das 5 divisões (COPA, EURO, SUPER, PREMIER, TODOS).

#### Passo 4: Processar as 5 Divisões (Ligas)

```
┌─────────────────────────────────────────────────────────────────┐
│                    LOOP: 5 DIVISÕES                             │
│  COPA → EURO → SUPER → PREMIER → TODOS                         │
└─────────────────────────────────────────────────────────────────┘

Para cada divisão (COPA, EURO, SUPER, PREMIER, TODOS):

   a) Clicar na primeira linha da tabela da divisão
   b) Confirmar no dialog (clicar em "Sim")
   c) Clicar no elemento div[2]
   d) Clicar em "VER MAIS"
   e) Extrair dados dos cards
   f) Salvar cards no banco de dados
   g) Voltar para página inicial (exceto após última divisão)
   h) Reabrir modal "Buscar Padrões"
   i) Clicar em "Buscar" novamente
```

#### Passo 5: Extração de Cards

```
Para cada card encontrado na divisão atual:
1. Obter título (ex: "3 wins - 70%")
2. Obter padrões (ex: "WIN WIN WIN")
3. Obter percentual (ex: "70%")
4. Obter estatísticas (SG, G1, G2)
5. Salvar no formato:
{
   "titulo": "3 wins - 70%",
   "padroes": "WIN WIN WIN",
   "percentual": "70%",
   "estatisticas": { "SG": 1, "G1": 2, "G2": 0 },
   "data_hora_busca": "2024-01-15T10:30:00.000Z",
   "divisao": "COPA"  // Adicionar divisão ao card
}
```

> **Nota:** Este processo é repetido PARA CADA uma das 5 divisões.

#### Passo 6: Salvamento no Banco

```
API Robot → POST http://localhost:5000/api/resultados-cards/inserir-lote
   │
   ▼
API .NET → INSERT em BBTipsDB.dbo.resultados_cards
   │
   ▼
Cada divisão salva seus cards separadamente

RESUMO DO PASSO 6 POR DIVISÃO:
┌────────────┬──────────────────┐
│ Divisão    │ Cards Extraídos  │
├────────────┼──────────────────┤
│ COPA       │ XXX cards        │
│ EURO       │ XXX cards        │
│ SUPER      │ XXX cards        │
│ PREMIER    │ XXX cards        │
│ TODOS      │ XXX cards        │
├────────────┼──────────────────┤
│ TOTAL      │ YYY cards        │
└────────────┴──────────────────┘
```

## Endpoints da API do Robot

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/health` | GET | Health check |
| `/api/sse` | GET | Server-Sent Events para logs |
| `/api/logs` | GET | Obter logs |
| `/api/status` | GET | Status do robot |
| `/api/robot/start` | POST | Iniciar robot |
| `/api/robot/buscador` | POST | Executar buscador |
| `/api/robot/stop` | POST | Parar robot |
| `/api/cards` | GET | Obter cards extraídos |
| `/Bot` | GET | Inserir cards no banco |
| `/simulador` | GET | Obter dados do simulador |

## Variáveis de Ambiente

| Variável | Valor Padrão | Descrição |
|----------|---------------|-----------|
| `BB_TIPS_URL` | https://app.bbtips.com.br | URL do site |
| `BB_TIPS_EMAIL` | - | Email de login |
| `BB_TIPS_SENHA` | - | Senha de login |
| `API_URL` | http://localhost:5000 | URL da API .NET |
| `PORT` | 3001 | Porta da API do Robot |
| `MAXIMO_PULOS` | 80 | Máximo de pulos |
| `PERCENTUAL_INICIAL` | 94 | Percentual inicial |
| `TOTAL_REGISTROS` | 3 | Total de registros |
| `STAKE_INICIAL` | 10 | Stake inicial |
| `MULTIPLICADOR` | 3 | Multiplicador |

## Logs

Os logs são salvos em:
- Console (tempo real)
- Arquivo: `src/robot/logs/bbtips_YYYY-MM-DD.log`
- SSE: `http://localhost:3001/api/sse`

## Como Executar

### Executar todos os serviços:
```powershell
.\init.ps1
```

### Executar apenas a API do Robot:
```cmd
cd src/robot
npm run start:api
```

### Executar o Robot manualmente:
```cmd
cd src/robot
npm run start
```

## Solução de Problemas

### Porta 3001 em uso:
```cmd
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Robot não encontra botão:
- Verificar se o site está na URL correta
- Verificar se o botão está visível
- Ajustar o XPath em `buscarPadroesSelector`

### Erro de login:
- Verificar credenciais no .env
- Verificar se o site está acessível

## Estrutura de Arquivos

```
src/robot/
├── src/
│   ├── selenium-server.js    # API do Robot (Express)
│   ├── robotService.js       # Serviço do Robot (Puppeteer)
│   └── index.js              # Entry point standalone
├── logs/                     # Logs de execução
├── screenshots/              # Screenshots de debug
├── package.json
└── .env
```
