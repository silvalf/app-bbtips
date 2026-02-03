using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using BBTipsManager.Core.Interfaces;
using BBTipsManager.Core.Models;
using BBTipsManager.Core.Enums;
using System.Collections.ObjectModel;

namespace BBTipsManager.App.ViewModels;

[QueryProperty(nameof(BancaId), "id")]
public partial class BancaDetalheViewModel : ObservableObject
{
    private readonly IBancaService _bancaService;
    private readonly IOperacaoService _operacaoService;

    public BancaDetalheViewModel(IBancaService bancaService, IOperacaoService operacaoService)
    {
        _bancaService = bancaService;
        _operacaoService = operacaoService;
        Operacoes = new ObservableCollection<Operacao>();
    }

    [ObservableProperty]
    private string bancaId = string.Empty;

    [ObservableProperty]
    private Banca? banca;

    [ObservableProperty]
    private ObservableCollection<Operacao> operacoes;

    [ObservableProperty]
    private bool isLoading;

    [ObservableProperty]
    private bool showNovaOperacao;

    // Nova operacao
    [ObservableProperty]
    private decimal novaOperacaoStake;

    [ObservableProperty]
    private decimal novaOperacaoOdd = 1.5m;

    [ObservableProperty]
    private string novaOperacaoEvento = string.Empty;

    [ObservableProperty]
    private string novaOperacaoPlacar = string.Empty;

    partial void OnBancaIdChanged(string value)
    {
        if (!string.IsNullOrEmpty(value))
        {
            _ = LoadBancaAsync();
        }
    }

    [RelayCommand]
    private async Task LoadBancaAsync()
    {
        if (string.IsNullOrEmpty(BancaId)) return;

        IsLoading = true;
        try
        {
            Banca = await _bancaService.ObterPorIdAsync(Guid.Parse(BancaId));
            if (Banca != null)
            {
                var ops = await _operacaoService.ObterPorBancaAsync(Banca.Id);
                Operacoes.Clear();
                foreach (var op in ops)
                {
                    Operacoes.Add(op);
                }
                
                // Calcula stake sugerida
                NovaOperacaoStake = await _operacaoService.CalcularProximaStakeAsync(Banca.Id);
            }
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private void ToggleNovaOperacao()
    {
        ShowNovaOperacao = !ShowNovaOperacao;
    }

    [RelayCommand]
    private async Task RegistrarOperacaoAsync()
    {
        if (Banca == null || NovaOperacaoOdd <= 1) return;

        var operacao = new Operacao
        {
            BancaId = Banca.Id,
            Stake = NovaOperacaoStake,
            Odd = NovaOperacaoOdd,
            Evento = NovaOperacaoEvento,
            Placar = NovaOperacaoPlacar,
            Mercado = Banca.Mercado,
            Status = StatusOperacao.Pendente
        };

        await _operacaoService.RegistrarOperacaoAsync(operacao);
        ShowNovaOperacao = false;
        await LoadBancaAsync();
    }

    [RelayCommand]
    private async Task MarcarGanhouAsync(Operacao operacao)
    {
        await _operacaoService.FinalizarOperacaoAsync(operacao.Id, true);
        await LoadBancaAsync();
    }

    [RelayCommand]
    private async Task MarcarPerdeuAsync(Operacao operacao)
    {
        await _operacaoService.FinalizarOperacaoAsync(operacao.Id, false);
        await LoadBancaAsync();
    }

    [RelayCommand]
    private async Task PausarBancaAsync()
    {
        if (Banca == null) return;
        Banca.Status = StatusBanca.Pausada;
        await _bancaService.AtualizarAsync(Banca);
        await LoadBancaAsync();
    }

    [RelayCommand]
    private async Task AtivarBancaAsync()
    {
        if (Banca == null) return;
        Banca.Status = StatusBanca.Ativa;
        await _bancaService.AtualizarAsync(Banca);
        await LoadBancaAsync();
    }
}
