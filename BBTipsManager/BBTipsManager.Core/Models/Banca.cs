using BBTipsManager.Core.Enums;

namespace BBTipsManager.Core.Models;

public class Banca
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nome { get; set; } = string.Empty;
    public decimal SaldoInicial { get; set; }
    public decimal SaldoAtual { get; set; }
    public decimal StopLoss { get; set; }          // % máxima de perda
    public decimal StopGain { get; set; }          // % meta de ganho
    public decimal StakeBase { get; set; }         // Valor base da entrada
    public TipoEstrategia Estrategia { get; set; }
    public StatusBanca Status { get; set; } = StatusBanca.Ativa;
    public TipoMercado Mercado { get; set; }
    public DateTime DataCriacao { get; set; } = DateTime.Now;
    public DateTime? DataUltimaOperacao { get; set; }
    public List<Operacao> Operacoes { get; set; } = new();
    public List<Padrao> Padroes { get; set; } = new();
    
    // Configurações de Martingale (para estratégia Alavancagem)
    public decimal Multiplicador { get; set; } = 2.0m;
    public int MaxGales { get; set; } = 3;
    
    // Métricas calculadas
    public decimal LucroTotal => SaldoAtual - SaldoInicial;
    public decimal PercentualLucro => SaldoInicial > 0 ? (LucroTotal / SaldoInicial) * 100 : 0;
    public int TotalOperacoes => Operacoes.Count;
    public int OperacoesGanhas => Operacoes.Count(o => o.Status == StatusOperacao.Ganhou);
    public int OperacoesPerdidas => Operacoes.Count(o => o.Status == StatusOperacao.Perdeu);
    public decimal Assertividade => TotalOperacoes > 0 ? (decimal)OperacoesGanhas / TotalOperacoes * 100 : 0;
}
