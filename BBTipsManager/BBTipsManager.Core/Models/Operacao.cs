using BBTipsManager.Core.Enums;

namespace BBTipsManager.Core.Models;

public class Operacao
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BancaId { get; set; }
    public Guid? PadraoId { get; set; }
    
    // Dados da Operação
    public decimal Stake { get; set; }
    public decimal Odd { get; set; }
    public decimal RetornoPotencial => Stake * Odd;
    public decimal? RetornoReal { get; set; }
    public decimal? LucroPrejuizo => RetornoReal.HasValue ? RetornoReal.Value - Stake : null;
    
    public StatusOperacao Status { get; set; } = StatusOperacao.Pendente;
    public TipoMercado Mercado { get; set; }
    
    // Informações do Jogo/Evento
    public string Evento { get; set; } = string.Empty;       // Ex: "Flamengo x Palmeiras"
    public string Liga { get; set; } = string.Empty;
    public string Placar { get; set; } = string.Empty;
    public string PlacarFinal { get; set; } = string.Empty;
    
    // Martingale
    public int NumeroGale { get; set; } = 0;                 // 0 = entrada normal, 1+ = gale
    public Guid? OperacaoAnteriorId { get; set; }            // Para rastrear cadeia de gales
    
    public DateTime DataHora { get; set; } = DateTime.Now;
    public string Observacao { get; set; } = string.Empty;
}
