# 🤖 Robô BB Tips com Puppeteer

Robô de automação para BB Tips usando Puppeteer (Node.js)

## 📋 Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

## 🚀 Instalação

1. Abra o terminal na pasta `backend-robo`

2. Execute o script de instalação:
```bash
.\install.bat
```

Ou instale manualmente:
```bash
npm install
npx puppeteer browsers install chrome
```

3. Configure as credenciais no arquivo `.env`

## ⚙️ Configuração

Edite o arquivo `.env` com suas informações:

```env
BBTIPS_EMAIL=seu-email@gmail.com
BBTIPS_SENHA=sua-senha
BBTIPS_URL=https://app.bbtips.com.br
INTERVALO=30
ESTRATEGIAS=Estratégia 1,Estratégia 2
```

## ▶️ Como executar

```bash
npm start
```

Ou:
```bash
node robo.js
```

## 📁 Screenshots

Os screenshots são salvos em: `c:\temp\bbtips_screenshots`

Formato dos arquivos:
- `login_inicio_YYYYMMDD_HHMMSS.png` - Página de login
- `login_preenchido_YYYYMMDD_HHMMSS.png` - Credenciais preenchidas
- `login_resultado_YYYYMMDD_HHMMSS.png` - Resultado do login
- `ciclo_N_inicio_YYYYMMDD_HHMMSS.png` - Início de cada ciclo
- `ciclo_N_fim_YYYYMMDD_HHMMSS.png` - Fim de cada ciclo

## 🔧 Para no robô

Pressione `Ctrl+C` no terminal.

## 📝 Logs

O robô exibe logs detalhados no console:
- 📘 INFO - Informações gerais
- ✅ SUCCESS - Operações bem-sucedidas  
- ⚠️ WARNING - Advertências
- ❌ ERROR - Erros
- 🔐 LOGIN - Operações de login
- 🔄 CYCLE - Ciclos do robô
