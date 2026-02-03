# Instrucoes de Instalacao e Execucao

## Requisitos

1. **.NET 8.0 SDK** - Baixe em: https://dotnet.microsoft.com/download/dotnet/8.0
2. **Visual Studio 2022** (versao 17.8 ou superior) com os workloads:
   - .NET MAUI
   - Desktop development with .NET
   - Mobile development with .NET

## Instalando Workloads MAUI

Apos instalar o .NET 8 SDK, execute no terminal:

```bash
dotnet workload install maui
```

## Executando o Projeto

### Via Linha de Comando (Windows)

```bash
cd BBTipsManager
dotnet restore
dotnet build
dotnet run --project BBTipsManager.App -f net8.0-windows10.0.19041.0
```

### Via Visual Studio

1. Abra o arquivo `BBTipsManager.sln`
2. Defina `BBTipsManager.App` como projeto de inicializacao
3. Selecione o target desejado:
   - Windows Machine (para desktop Windows)
   - Android Emulator (para Android)
   - iOS Simulator (para iOS - requer Mac)
4. Pressione F5 ou clique em "Iniciar"

## Estrutura do App

### Telas Principais:

1. **Dashboard** - Visao geral de todas as bancas
2. **Bancas** - Gerenciamento de multiplas bancas
3. **Padroes** - Cadastro de padroes do BB Tips
4. **Simulador** - Simulacao de estrategias
5. **Configuracoes** - Credenciais e preferencias

### Estrategias de Gestao de Risco:

| Estrategia | Stake | Gales | Stop Loss | Stop Gain |
|------------|-------|-------|-----------|-----------|
| Conservadora | 1% fixo | 0 | 15% | 20% |
| Moderada | Variavel | 2 (1.5x) | 20% | 30% |
| Alavancagem | Martingale | 3 (2x) | 30% | 50% |

## Funcionalidades Futuras

- [ ] Integracao automatica com BB Tips via WebView2
- [ ] Login automatico
- [ ] Busca automatica de padroes
- [ ] Entrada automatica de operacoes
- [ ] Graficos e relatorios

## Suporte

Credenciais BB Tips salvas em Configuracoes.
URL: https://app.bbtips.com.br
