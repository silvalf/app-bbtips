using BBTipsManager.Core.Models;

namespace BBTipsManager.Core.Interfaces;

public interface IBBTipsAutomation
{
    Task<bool> LoginAsync(string email, string senha);
    Task LogoutAsync();
    Task<bool> EstaLogadoAsync();
    Task<List<PadraoEncontrado>> BuscarPadroesAsync(FiltroBusca filtro);
    Task<bool> SelecionarPadraoAsync(PadraoEncontrado padrao);
    Task<SimulacaoResultado> SimularEstrategiaAsync(decimal stakeInicial, decimal multiplicador, int maxGales);
    Task<bool> CriarRoboAsync(ConfiguracaoRobo config);
    Task<string> CapturarTelaAsync();  // Para debug
}

public class FiltroBusca
{
    public int? MercadoId { get; set; }
    public decimal? OddMinima { get; set; }
    public decimal? OddMaxima { get; set; }
    public decimal? AssertividadeMinima { get; set; }
    public string? Liga { get; set; }
    public string? Placar { get; set; }
    public int? MinutoInicio { get; set; }
    public int? MinutoFim { get; set; }
}

public class PadraoEncontrado
{
    public string Id { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public decimal OddMedia { get; set; }
    public decimal Assertividade { get; set; }
    public int TotalJogos { get; set; }
    public int TotalAcertos { get; set; }
    public string Placar { get; set; } = string.Empty;
    public string Liga { get; set; } = string.Empty;
}

public class SimulacaoResultado
{
    public decimal LucroPotencial { get; set; }
    public decimal RiscoPotencial { get; set; }
    public List<LinhaSimulacao> Linhas { get; set; } = new();
}

public class LinhaSimulacao
{
    public int Gale { get; set; }
    public decimal Stake { get; set; }
    public decimal Odd { get; set; }
    public decimal RetornoPotencial { get; set; }
    public decimal LucroAcumulado { get; set; }
    public decimal PrejuizoAcumulado { get; set; }
}

public class ConfiguracaoRobo
{
    public string Nome { get; set; } = string.Empty;
    public Guid PadraoId { get; set; }
    public decimal StakeInicial { get; set; }
    public decimal Multiplicador { get; set; }
    public int MaxGales { get; set; }
    public decimal StopLoss { get; set; }
    public decimal StopGain { get; set; }
}
