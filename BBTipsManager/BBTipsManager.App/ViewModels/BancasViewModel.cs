using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using BBTipsManager.Core.Interfaces;
using BBTipsManager.Core.Models;
using BBTipsManager.Core.Enums;
using System.Collections.ObjectModel;

namespace BBTipsManager.App.ViewModels;

public partial class BancasViewModel : ObservableObject
{
    private readonly IBancaService _bancaService;

    public BancasViewModel(IBancaService bancaService)
    {
        _bancaService = bancaService;
        Bancas = new ObservableCollection<Banca>();
        Mercados = new ObservableCollection<string>(Enum.GetNames<TipoMercado>());
        Estrategias = new ObservableCollection<string>(Enum.GetNames<TipoEstrategia>());
    }

    [ObservableProperty]
    private ObservableCollection<Banca> bancas;

    [ObservableProperty]
    private ObservableCollection<string> mercados;

    [ObservableProperty]
    private ObservableCollection<string> estrategias;

    [ObservableProperty]
    private bool isLoading;

    [ObservableProperty]
    private bool showNovaBanca;

    // Campos para nova banca
    [ObservableProperty]
    private string novoBancaNome = string.Empty;

    [ObservableProperty]
    private decimal novoBancaSaldoInicial;

    [ObservableProperty]
    private decimal novoBancaStopLoss = 20;

    [ObservableProperty]
    private decimal novoBancaStopGain = 30;

    [ObservableProperty]
    private decimal novoBancaStakeBase = 10;

    [ObservableProperty]
    private decimal novoBancaMultiplicador = 2;

    [ObservableProperty]
    private int novoBancaMaxGales = 3;

    [ObservableProperty]
    private string novoBancaMercadoSelecionado = "Futebol";

    [ObservableProperty]
    private string novoBancaEstrategiaSelecionada = "Moderada";

    [RelayCommand]
    private async Task LoadBancasAsync()
    {
        IsLoading = true;
        try
        {
            var todasBancas = await _bancaService.ObterTodasAsync();
            Bancas.Clear();
            foreach (var banca in todasBancas.OrderByDescending(b => b.DataCriacao))
            {
                Bancas.Add(banca);
            }
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private void ToggleNovaBanca()
    {
        ShowNovaBanca = !ShowNovaBanca;
        if (ShowNovaBanca)
        {
            // Reset campos
            NovoBancaNome = string.Empty;
            NovoBancaSaldoInicial = 0;
            NovoBancaStopLoss = 20;
            NovoBancaStopGain = 30;
            NovoBancaStakeBase = 10;
            NovoBancaMultiplicador = 2;
            NovoBancaMaxGales = 3;
        }
    }

    [RelayCommand]
    private async Task SalvarNovaBancaAsync()
    {
        if (string.IsNullOrWhiteSpace(NovoBancaNome) || NovoBancaSaldoInicial <= 0)
        {
            await Shell.Current.DisplayAlert("Erro", "Preencha o nome e saldo inicial", "OK");
            return;
        }

        var novaBanca = new Banca
        {
            Nome = NovoBancaNome,
            SaldoInicial = NovoBancaSaldoInicial,
            StopLoss = NovoBancaStopLoss,
            StopGain = NovoBancaStopGain,
            StakeBase = NovoBancaStakeBase,
            Multiplicador = NovoBancaMultiplicador,
            MaxGales = NovoBancaMaxGales,
            Mercado = Enum.Parse<TipoMercado>(NovoBancaMercadoSelecionado),
            Estrategia = Enum.Parse<TipoEstrategia>(NovoBancaEstrategiaSelecionada)
        };

        await _bancaService.CriarAsync(novaBanca);
        ShowNovaBanca = false;
        await LoadBancasAsync();
    }

    [RelayCommand]
    private async Task AbrirBancaAsync(Banca banca)
    {
        await Shell.Current.GoToAsync($"{nameof(Pages.BancaDetalhePage)}?id={banca.Id}");
    }

    [RelayCommand]
    private async Task ExcluirBancaAsync(Banca banca)
    {
        var confirm = await Shell.Current.DisplayAlert(
            "Confirmar", 
            $"Deseja excluir a banca '{banca.Nome}'?", 
            "Sim", "Nao");

        if (confirm)
        {
            await _bancaService.ExcluirAsync(banca.Id);
            await LoadBancasAsync();
        }
    }
}
