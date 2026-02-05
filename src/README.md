# BB Tips - .NET Core + Angular + Node.js Robot

## 📁 Estrutura do Projeto

```
app-bbtips/
├── src/
│   ├── api/                    # Backend .NET Core 8.0
│   │   └── BBTips.Api/
│   │       ├── Controllers/    # API Controllers
│   │       ├── Models/         # Entity Models
│   │       ├── Services/       # Business Logic
│   │       ├── Program.cs
│   │       └── BBTips.Api.csproj
│   │
│   ├── web/                    # Frontend Angular 17+
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── components/
│   │   │   │   ├── services/
│   │   │   │   └── app.module.ts
│   │   │   └── index.html
│   │   └── package.json
│   │
│   └── robot/                  # Robot Node.js + Puppeteer
│       ├── src/
│       │   └── services/
│       │       └── robotService.js
│       └── package.json
│
├── .gitignore
└── README.md
```

## 🚀 Quick Start

### API (.NET Core)

```bash
cd src/api
dotnet restore
dotnet run
# API disponível em http://localhost:5000
```

### Frontend (Angular)

```bash
cd src/web
npm install
ng serve
# Frontend disponível em http://localhost:4200
```

### Robot (Node.js + Puppeteer)

```bash
cd src/robot
npm install
npm start
# Robot abre navegador visível
```

## 🔧 Configuração

Crie `.env` no diretório `src/robot/`:

```env
BB_TIPS_URL=https://app.bbtips.com.br
BB_TIPS_EMAIL=seu@email.com
BB_TIPS_SENHA=sua_senha
INTERVALO_VERIFICACAO=30

# Buscador de Padrões
MAXIMO_PULOS=80
PERCENTUAL_INICIAL=94
TOTAL_REGISTROS=3
STAKE_INICIAL=10
MULTIPLICADOR=3
```

## 📦 Tecnologias

| Camada | Tecnologia |
|--------|-------------|
| Backend API | .NET Core 8.0, ASP.NET Core Web API |
| Frontend | Angular 17+, TypeScript |
| Robot | Node.js 20+, Puppeteer |
| Database | SQL Server / PostgreSQL |

## 🔥 Fluxo do Robot

1. Faz login no BB Tips
2. Navega para `/bots/novo`
3. Clica no botão "Buscador de Padrões"
4. Preenche parâmetros:
   - Máximo Pulos = 80
   - % Inicial = 94
   - Total Registros = 3
5. Clica em Buscar
6. Clica na primeira linha da tabela
7. Aceita Alert (Sim)
8. Clica em "Opções Avançadas" → "Ver Mais"
9. Preenche Stake Inicial = 10, Multiplicador = 3
10. Clica em Calcular
11. Lista melhores lucros ordenados

## 📝 API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/bots | Lista todos os bots |
| POST | /api/bots | Cria um novo bot |
| PUT | /api/bots/:id | Atualiza um bot |
| DELETE | /api/bots/:id | Remove um bot |
| GET | /api/logs | Lista logs |

## 🧹 Projeto Higienizado

- ✅ Removido: `.em`ergent` (vazio)
- ✅ Removido: `backend/` (Python)
- ✅ Removido: `BBTipsManager/` (MAUI)
- ✅ Novo: Estrutura .NET Core + Angular
- ✅ Robot: Node.js + Puppeteer

## 📄 Licença

MIT License
