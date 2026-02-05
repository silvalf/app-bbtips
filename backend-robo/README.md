# 🤖 Robô BB Tips com Puppeteer

Robô de automação para login e monitoramento no BB Tips usando Puppeteer (Node.js)

## 📋 Pré-requisitos

- **Node.js 18+** instalado
- **npm** ou **yarn**

## 🚀 Instalação Rápida (Windows)

1. Abra o **PowerShell** ou **CMD** na pasta `backend-robo`

2. Instale as dependências:
```powershell
npm install
```

3. O Puppeteer baixará automaticamente o Chrome na primeira execução.

## ⚙️ Configuração

O arquivo `.env` já está configurado com suas credenciais:

```env
BBTIPS_EMAIL=luizsilva.perfil@gmail.com
BBTIPS_SENHA=@Leo102030
BBTIPS_URL=https://app.bbtips.com.br
INTERVALO=30
```

### Variáveis disponíveis:

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `BBTIPS_EMAIL` | Email de login | - |
| `BBTIPS_SENHA` | Senha de login | - |
| `BBTIPS_URL` | URL base do BB Tips | https://app.bbtips.com.br |
| `INTERVALO` | Intervalo entre ciclos (segundos) | 30 |
| `ESTRATEGIAS` | Estratégias ativas (separadas por vírgula) | - |
| `DEBUG` | Modo debug | false |

## ▶️ Como Executar

```powershell
npm start
```

Ou diretamente:
```powershell
node robo.js
```

## 📸 Screenshots

Os screenshots são salvos automaticamente em:
- **Windows**: `c:\temp\bbtips_screenshots\`
- **Linux/Mac**: `/tmp/bbtips_screenshots/`

Arquivos gerados:
- `login_pagina_carregada_*.png` - Página de login
- `login_preenchido_*.png` - Credenciais preenchidas
- `login_resultado_*.png` - Resultado do login
- `ciclo_N_*.png` - Screenshots de cada ciclo

## 🛑 Parar o Robô

Pressione `Ctrl+C` no terminal.

## 📝 Logs

O robô exibe logs detalhados no console:
- 📘 INFO - Informações gerais
- ✅ SUCCESS - Operações bem-sucedidas  
- ⚠️ WARNING - Advertências
- ❌ ERROR - Erros
- 🔐 LOGIN - Operações de login
- 🔄 CYCLE - Ciclos do robô

## 🔧 Troubleshooting

### Erro: "Chrome not found"
Execute:
```powershell
npx puppeteer browsers install chrome
```

### Erro de certificado SSL
O site usa HTTPS, o Puppeteer deve lidar automaticamente.

### Login falhou
1. Verifique as credenciais no arquivo `.env`
2. Confira os screenshots em `c:\temp\bbtips_screenshots`
3. O site pode ter mudado a estrutura - verifique os seletores

## 📁 Estrutura de Arquivos

```
backend-robo/
├── robo.js         # Código principal do robô
├── package.json    # Dependências Node.js
├── .env            # Credenciais (não commitar!)
├── install.bat     # Script de instalação Windows
└── README.md       # Este arquivo
```

## 🔒 Segurança

⚠️ **IMPORTANTE**: O arquivo `.env` contém suas credenciais. 
- NÃO commite este arquivo no Git
- Mantenha-o seguro e privado
