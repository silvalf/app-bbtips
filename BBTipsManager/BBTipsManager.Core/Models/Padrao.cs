using BBTipsManager.Core.Enums;

namespace BBTipsManager.Core.Models;

public class Padrao
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nome { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    
    // Configurações do Padrão (vindo do BB Tips)
    public decimal OddMinima { get; set; }
    public decimal OddMaxima { get; set; }
    public decimal OddMedia { get; set; }
    public string Placar { get; set; } = string.Empty;      // Ex: "0x0", "1x0", etc.
    public decimal Assertividade { get; set; }               // % de acerto histórico
    public int TotalJogos { get; set; }                      // Quantidade de jogos analisados
    public int TotalAcertos { get; set; }
    
    // Filtros do Buscador
    public string Liga { get; set; } = string.Empty;
    public string Time { get; set; } = string.Empty;
    public int MinutoInicio { get; set; }
    public int MinutoFim { get; set; }
    
    public TipoMercado Mercado { get; set; }
    public DateTime DataCriacao { get; set; } = DateTime.Now;
    public bool Ativo { get; set; } = true;
    
    // Estatísticas de uso
    public int VezesUsado { get; set; }
    public decimal LucroGerado { get; set; }
}
