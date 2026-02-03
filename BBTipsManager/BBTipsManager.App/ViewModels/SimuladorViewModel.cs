using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using BBTipsManager.Core.Helpers;
using BBTipsManager.Core.Enums;
using System.Collections.ObjectModel;

namespace BBTipsManager.App.ViewModels;

public partial class SimuladorViewModel : ObservableObject
{
    public SimuladorViewModel()
    {
        Estrategias = new ObservableCollection<string>(Enum.GetNames<TipoEstrategia>());
        LinhasSimulacao = new ObservableCollection<LinhaSimulacaoEstrategia>();
    }

    [ObservableProperty]
    private ObservableCollection<string> estrategias;

    [ObservableProperty]
    private ObservableCollection<LinhaSimulacaoEstrategia> linhasSimulacao;

    // Inputs
    [ObservableProperty]
    private decimal saldoInicial = 1000;

    [ObservableProperty]
    private decimal stakeBase = 10;

    [ObservableProperty]
    private decimal oddMedia = 1.5m;

    [ObservableProperty]
    private decimal multiplicador = 2;

    [ObservableProperty]
    private int maxGales = 3;

    [ObservableProperty]
    private decimal assertividadeEsperada = 70;

    [ObservableProperty]
    private string estrategiaSelecionada = "Moderada";

    // Resultados
    [ObservableProperty]
    private decimal riscoTotal;

    [ObservableProperty]
    private decimal percentualRisco;

    [ObservableProperty]
    private decimal lucroPotencial;

    [ObservableProperty]
    private int operacoesPossiveis;

    [ObservableProperty]
    private bool showResultados;

    // Sugestao
    [ObservableProperty]
    private SugestaoConfiguracao? sugestao;

    [ObservableProperty]
    private bool showSugestao;

    [RelayCommand]
    private void Simular()
    {
        var estrategia = Enum.Parse<TipoEstrategia>(EstrategiaSelecionada);
        
        var resultado = GestaoRisco.SimularEstrategia(
            SaldoInicial,
            StakeBase,
            OddMedia,
            Multiplicador,
            MaxGales,
            estrategia);

        LinhasSimulacao.Clear();
        foreach (var linha in resultado.Linhas)
        {
            LinhasSimulacao.Add(linha);
        }

        RiscoTotal = resultado.RiscoTotal;
        PercentualRisco = resultado.PercentualRiscoBanca;
        LucroPotencial = resultado.LucroPotencialMaximo;
        OperacoesPossiveis = (int)(SaldoInicial / resultado.RiscoTotal);
        
        ShowResultados = true;
    }

    [RelayCommand]
    private void GerarSugestao()
    {
        Sugestao = GestaoRisco.SugerirConfiguracao(
            SaldoInicial,
            AssertividadeEsperada,
            OddMedia);
        
        ShowSugestao = true;
    }

    [RelayCommand]
    private void AplicarSugestao()
    {
        if (Sugestao == null) return;

        StakeBase = Sugestao.StakeSugerida;
        MaxGales = Sugestao.MaxGalesSugerido;
        Multiplicador = Sugestao.MultiplicadorSugerido;
        EstrategiaSelecionada = Sugestao.EstrategiaSugerida.ToString();
        
        Simular();
    }

    [RelayCommand]
    private void LimparResultados()
    {
        ShowResultados = false;
        ShowSugestao = false;
        LinhasSimulacao.Clear();
    }
}
