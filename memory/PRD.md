# BB Tips Manager - PRD

## Data: 03/02/2026

## Problema Original
Usuario quer um sistema .NET MAUI para:
- Acessar BB Tips (https://app.bbtips.com.br)
- Gerenciar multiplas bancas de apostas
- Criar padroes com protecao de capital (stop loss)
- Criar estrategias conservadoras e de alavancagem
- Futuramente automatizar entradas

## Credenciais
- Email: luizsilva.perfil@gmail.com
- Senha: @Leo102030

## Personas
- **Apostador Conservador**: Quer proteger capital com stakes fixas
- **Apostador Agressivo**: Quer alavancagem com Martingale controlado

## Requisitos Core (P0)
- [x] Gerenciamento de N bancas
- [x] Cadastro de padroes (odds, placares, assertividade)
- [x] Estrategias: Conservadora, Moderada, Alavancagem
- [x] Gestao de risco (Stop Loss / Stop Gain)
- [x] Simulador de estrategias
- [x] Registro de operacoes

## Implementado
- BBTipsManager.Core (biblioteca de negocios)
  - Models: Banca, Padrao, Operacao, Configuracao
  - Enums: TipoEstrategia, StatusBanca, StatusOperacao, TipoMercado
  - Services: BancaService, PadraoService, OperacaoService, JsonDataStore
  - Helpers: GestaoRisco (calculos de stake, simulacao, sugestoes)
  
- BBTipsManager.App (app MAUI)
  - Pages: Dashboard, Bancas, BancaDetalhe, Padroes, Simulador, Configuracoes
  - ViewModels com MVVM (CommunityToolkit.Mvvm)
  - Tema Dark inspirado em trading
  - Persistencia local em JSON

## Backlog (P1)
- [ ] Integracao WebView2 com BB Tips
- [ ] Login automatico
- [ ] Busca de padroes automatica
- [ ] Graficos de desempenho

## Backlog (P2)
- [ ] Entrada automatica de operacoes
- [ ] Notificacoes push
- [ ] Export de relatorios
- [ ] Sincronizacao cloud
