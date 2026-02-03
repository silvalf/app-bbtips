using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using BBTipsManager.Core.Interfaces;
using BBTipsManager.Core.Models;
using System.Collections.ObjectModel;

namespace BBTipsManager.App.ViewModels;

public partial class DashboardViewModel : ObservableObject
{
    private readonly IBancaService _bancaService;

    public DashboardViewModel(IBancaService bancaService)
    {
        _bancaService = bancaService;
        Bancas = new ObservableCollection<Banca>();
    }

    [ObservableProperty]
    private ObservableCollection<Banca> bancas;

    [ObservableProperty]
    private decimal saldoTotal;

    [ObservableProperty]
    private decimal lucroTotal;

    [ObservableProperty]
    private decimal percentualLucro;

    [ObservableProperty]
    private int totalOperacoes;

    [ObservableProperty]
    private decimal assertividadeMedia;

    [ObservableProperty]
    private int bancasAtivas;

    [ObservableProperty]
    private int bancasStopLoss;

    [ObservableProperty]
    private int bancasMeta;

    [ObservableProperty]
    private bool isLoading;

    [RelayCommand]
    private async Task LoadDataAsync()
    {
        IsLoading = true;
        try
        {
            var todasBancas = await _bancaService.ObterTodasAsync();
            
            Bancas.Clear();
            foreach (var banca in todasBancas.OrderByDescending(b => b.DataUltimaOperacao ?? b.DataCriacao))
            {
                Bancas.Add(banca);
            }

            // Calcula totais
            SaldoTotal = todasBancas.Sum(b => b.SaldoAtual);
            LucroTotal = todasBancas.Sum(b => b.LucroTotal);
            
            var saldoInicialTotal = todasBancas.Sum(b => b.SaldoInicial);
            PercentualLucro = saldoInicialTotal > 0 
                ? (LucroTotal / saldoInicialTotal) * 100 
                : 0;

            TotalOperacoes = todasBancas.Sum(b => b.TotalOperacoes);
            
            var bancasComOperacoes = todasBancas.Where(b => b.TotalOperacoes > 0).ToList();
            AssertividadeMedia = bancasComOperacoes.Any() 
                ? bancasComOperacoes.Average(b => b.Assertividade) 
                : 0;

            BancasAtivas = todasBancas.Count(b => b.Status == Core.Enums.StatusBanca.Ativa);
            BancasStopLoss = todasBancas.Count(b => b.Status == Core.Enums.StatusBanca.StopLoss);
            BancasMeta = todasBancas.Count(b => b.Status == Core.Enums.StatusBanca.Meta);
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task NavigateToBancasAsync()
    {
        await Shell.Current.GoToAsync("//Bancas");
    }

    [RelayCommand]
    private async Task NavigateToSimuladorAsync()
    {
        await Shell.Current.GoToAsync("//Simulador");
    }
}
