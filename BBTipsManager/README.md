# BB Tips Manager

Sistema de gerenciamento de bancas e padroes para apostas esportivas com gestao de risco e estrategias de protecao.

## Funcionalidades

### Dashboard
- Visao geral de todas as bancas
- Saldo total, lucro e assertividade
- Status das bancas (Ativa, Pausada, Stop Loss, Meta)

### Gestao de Bancas
- Criar multiplas bancas
- Configurar:
  - Saldo inicial
  - Stop Loss (% maxima de perda)
  - Stop Gain (meta de lucro)
  - Stake base
  - Multiplicador (para Martingale)
  - Max Gales
  - Mercado (Futebol, SpeedWay, Galgos, Roletas, Blaze)
  - Estrategia (Conservadora, Moderada, Alavancagem)

### Estrategias de Gestao de Risco

#### Conservadora
- Stake fixa (1% do saldo)
- Sem gales
- Stop Loss 15%
- Stop Gain 20%
- Protecao maxima do capital

#### Moderada
- Stake variavel
- Gale com multiplicador 1.5x
- Max 2 gales
- Stop Loss 20%
- Stop Gain 30%

#### Alavancagem (Martingale)
- Stake com Martingale completo
- Multiplicador 2x
- Max 3 gales
- Stop Loss 30%
- Stop Gain 50%
- Maior risco, maior potencial

### Cadastro de Padroes
- Registrar padroes do BB Tips
- Configurar:
  - Odd minima/maxima/media
  - Placar
  - Assertividade
  - Liga
  - Minuto inicio/fim

### Simulador
- Simular estrategias antes de aplicar
- Ver risco total e % da banca
- Detalhamento por gale
- Sugestao automatica de configuracao baseada na assertividade

### Registro de Operacoes
- Registrar entradas com stake e odd
- Marcar como ganhou/perdeu
- Historico completo
- Calculo automatico de lucro/prejuizo

## Requisitos

- .NET 8.0 SDK
- Visual Studio 2022 (17.8+) com workload MAUI
- Windows 10/11, macOS ou Android/iOS para teste

## Como Executar

### Windows

```bash
# Restaurar pacotes
dotnet restore

# Compilar
dotnet build

# Executar (Windows)
dotnet run --project BBTipsManager.App -f net8.0-windows10.0.19041.0
```

### Visual Studio

1. Abra `BBTipsManager.sln`
2. Selecione o projeto `BBTipsManager.App` como startup
3. Escolha o target (Windows, Android, iOS, Mac)
4. Pressione F5

## Estrutura do Projeto

```
BBTipsManager/
├── BBTipsManager.sln
├── BBTipsManager.Core/           # Biblioteca de negocios
│   ├── Enums/
│   ├── Models/
│   │   ├── Banca.cs
│   │   ├── Padrao.cs
│   │   ├── Operacao.cs
│   │   └── Configuracao.cs
│   ├── Interfaces/
│   ├── Services/
│   └── Helpers/
│       └── GestaoRisco.cs        # Calculos de gestao de risco
└── BBTipsManager.App/            # App MAUI
    ├── Pages/
    │   ├── DashboardPage
    │   ├── BancasPage
    │   ├── BancaDetalhePage
    │   ├── PadroesPage
    │   ├── SimuladorPage
    │   └── ConfiguracoesPage
    ├── ViewModels/
    ├── Services/
    └── Resources/
```

## Proximas Versoes

- [ ] Integracao automatica com BB Tips (WebView2 + Playwright)
- [ ] Login automatico
- [ ] Busca de padroes automatica
- [ ] Entrada automatica de operacoes
- [ ] Notificacoes de Stop Loss/Gain
- [ ] Graficos de desempenho
- [ ] Export de relatorios

## Credenciais BB Tips

Email: luizsilva.perfil@gmail.com
Senha: @Leo102030

URL: https://app.bbtips.com.br

## Licenca

Uso pessoal - Luiz Silva
