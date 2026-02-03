using BBTipsManager.Core.Enums;
using BBTipsManager.Core.Models;

namespace BBTipsManager.Core.Helpers;

public static class GestaoRisco
{
    /// <summary>
    /// Calcula a stake baseada na estratégia da banca
    /// </summary>
    public static decimal CalcularStake(Banca banca, bool gale = false, int numeroGale = 0)
    {
        return banca.Estrategia switch
        {
            TipoEstrategia.Conservadora => CalcularStakeConservadora(banca),
            TipoEstrategia.Moderada => CalcularStakeModerada(banca, gale, numeroGale),
            TipoEstrategia.Alavancagem => CalcularStakeAlavancagem(banca, gale, numeroGale),
            _ => banca.StakeBase
        };
    }

    /// <summary>
    /// Estratégia Conservadora: Stake fixa baseada em % do saldo
    /// Recomendado: 1-2% do saldo por entrada
    /// </summary>
    private static decimal CalcularStakeConservadora(Banca banca)
    {
        // 1% do saldo atual (proteção máxima)
        var stakeCalculada = banca.SaldoAtual * 0.01m;
        return Math.Max(stakeCalculada, banca.StakeBase);
    }

    /// <summary>
    /// Estratégia Moderada: Stake variável com gale limitado
    /// </summary>
    private static decimal CalcularStakeModerada(Banca banca, bool gale, int numeroGale)
    {
        if (!gale || numeroGale == 0)
            return banca.StakeBase;

        // Gale com multiplicador menor (1.5x ao invés de 2x)
        return banca.StakeBase * (decimal)Math.Pow(1.5, numeroGale);
    }

    /// <summary>
    /// Estratégia Alavancagem: Martingale completo
    /// </summary>
    private static decimal CalcularStakeAlavancagem(Banca banca, bool gale, int numeroGale)
    {
        if (!gale || numeroGale == 0)
            return banca.StakeBase;

        if (numeroGale > banca.MaxGales)
            return 0; // Não permite mais gales

        return banca.StakeBase * (decimal)Math.Pow((double)banca.Multiplicador, numeroGale);
    }

    /// <summary>
    /// Verifica se atingiu Stop Loss
    /// </summary>
    public static bool VerificarStopLoss(Banca banca)
    {
        var percentualPerdido = ((banca.SaldoInicial - banca.SaldoAtual) / banca.SaldoInicial) * 100;
        return percentualPerdido >= banca.StopLoss;
    }

    /// <summary>
    /// Verifica se atingiu Stop Gain (meta)
    /// </summary>
    public static bool VerificarStopGain(Banca banca)
    {
        var percentualGanho = ((banca.SaldoAtual - banca.SaldoInicial) / banca.SaldoInicial) * 100;
        return percentualGanho >= banca.StopGain;
    }

    /// <summary>
    /// Simula uma sequência de operações para análise
    /// </summary>
    public static SimulacaoEstrategia SimularEstrategia(
        decimal saldoInicial,
        decimal stakeBase,
        decimal oddMedia,
        decimal multiplicador,
        int maxGales,
        TipoEstrategia estrategia)
    {
        var resultado = new SimulacaoEstrategia
        {
            SaldoInicial = saldoInicial,
            StakeBase = stakeBase,
            OddMedia = oddMedia,
            Estrategia = estrategia
        };

        decimal stakeAcumulada = 0;
        
        for (int gale = 0; gale <= maxGales; gale++)
        {
            var stake = gale == 0 
                ? stakeBase 
                : stakeBase * (decimal)Math.Pow((double)multiplicador, gale);
            
            stakeAcumulada += stake;
            
            var retornoPotencial = stake * oddMedia;
            var lucroSeGanhar = retornoPotencial - stakeAcumulada;
            
            resultado.Linhas.Add(new LinhaSimulacaoEstrategia
            {
                Gale = gale,
                Stake = stake,
                StakeAcumulada = stakeAcumulada,
                RetornoPotencial = retornoPotencial,
                LucroSeGanhar = lucroSeGanhar,
                PercentualBanca = (stakeAcumulada / saldoInicial) * 100
            });
        }

        resultado.RiscoTotal = stakeAcumulada;
        resultado.PercentualRiscoBanca = (stakeAcumulada / saldoInicial) * 100;
        resultado.LucroPotencialMaximo = resultado.Linhas.Last().LucroSeGanhar;

        return resultado;
    }

    /// <summary>
    /// Calcula quantas operações podem ser feitas com a banca atual
    /// </summary>
    public static int CalcularCapacidadeOperacoes(Banca banca, decimal oddMedia)
    {
        var simulacao = SimularEstrategia(
            banca.SaldoAtual,
            banca.StakeBase,
            oddMedia,
            banca.Multiplicador,
            banca.MaxGales,
            banca.Estrategia);

        return (int)(banca.SaldoAtual / simulacao.RiscoTotal);
    }

    /// <summary>
    /// Sugere configuração ideal baseada em assertividade
    /// </summary>
    public static SugestaoConfiguracao SugerirConfiguracao(
        decimal saldoInicial,
        decimal assertividadeEsperada,
        decimal oddMedia)
    {
        var sugestao = new SugestaoConfiguracao();

        // Se assertividade > 70%, pode ser mais agressivo
        if (assertividadeEsperada >= 70)
        {
            sugestao.EstrategiaSugerida = TipoEstrategia.Alavancagem;
            sugestao.StakeSugerida = saldoInicial * 0.02m;  // 2%
            sugestao.MaxGalesSugerido = 3;
            sugestao.MultiplicadorSugerido = 2.0m;
            sugestao.StopLossSugerido = 30;
            sugestao.StopGainSugerido = 50;
        }
        // Se assertividade entre 55-70%, moderado
        else if (assertividadeEsperada >= 55)
        {
            sugestao.EstrategiaSugerida = TipoEstrategia.Moderada;
            sugestao.StakeSugerida = saldoInicial * 0.015m; // 1.5%
            sugestao.MaxGalesSugerido = 2;
            sugestao.MultiplicadorSugerido = 1.5m;
            sugestao.StopLossSugerido = 20;
            sugestao.StopGainSugerido = 30;
        }
        // Se assertividade < 55%, conservador
        else
        {
            sugestao.EstrategiaSugerida = TipoEstrategia.Conservadora;
            sugestao.StakeSugerida = saldoInicial * 0.01m;  // 1%
            sugestao.MaxGalesSugerido = 0;
            sugestao.MultiplicadorSugerido = 1.0m;
            sugestao.StopLossSugerido = 15;
            sugestao.StopGainSugerido = 20;
        }

        // Calcula risco
        var simulacao = SimularEstrategia(
            saldoInicial,
            sugestao.StakeSugerida,
            oddMedia,
            sugestao.MultiplicadorSugerido,
            sugestao.MaxGalesSugerido,
            sugestao.EstrategiaSugerida);

        sugestao.RiscoOperacao = simulacao.PercentualRiscoBanca;
        sugestao.OperacoesPossiveis = (int)(saldoInicial / simulacao.RiscoTotal);

        return sugestao;
    }
}

public class SimulacaoEstrategia
{
    public decimal SaldoInicial { get; set; }
    public decimal StakeBase { get; set; }
    public decimal OddMedia { get; set; }
    public TipoEstrategia Estrategia { get; set; }
    public decimal RiscoTotal { get; set; }
    public decimal PercentualRiscoBanca { get; set; }
    public decimal LucroPotencialMaximo { get; set; }
    public List<LinhaSimulacaoEstrategia> Linhas { get; set; } = new();
}

public class LinhaSimulacaoEstrategia
{
    public int Gale { get; set; }
    public decimal Stake { get; set; }
    public decimal StakeAcumulada { get; set; }
    public decimal RetornoPotencial { get; set; }
    public decimal LucroSeGanhar { get; set; }
    public decimal PercentualBanca { get; set; }
}

public class SugestaoConfiguracao
{
    public TipoEstrategia EstrategiaSugerida { get; set; }
    public decimal StakeSugerida { get; set; }
    public int MaxGalesSugerido { get; set; }
    public decimal MultiplicadorSugerido { get; set; }
    public decimal StopLossSugerido { get; set; }
    public decimal StopGainSugerido { get; set; }
    public decimal RiscoOperacao { get; set; }
    public int OperacoesPossiveis { get; set; }
}
