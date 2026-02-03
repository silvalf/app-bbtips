using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using BBTipsManager.Core.Interfaces;
using BBTipsManager.Core.Models;
using BBTipsManager.Core.Enums;
using System.Collections.ObjectModel;

namespace BBTipsManager.App.ViewModels;

public partial class PadroesViewModel : ObservableObject
{
    private readonly IPadraoService _padraoService;

    public PadroesViewModel(IPadraoService padraoService)
    {
        _padraoService = padraoService;
        Padroes = new ObservableCollection<Padrao>();
        Mercados = new ObservableCollection<string>(Enum.GetNames<TipoMercado>());
    }

    [ObservableProperty]
    private ObservableCollection<Padrao> padroes;

    [ObservableProperty]
    private ObservableCollection<string> mercados;

    [ObservableProperty]
    private bool isLoading;

    [ObservableProperty]
    private bool showNovoPadrao;

    // Novo padrao
    [ObservableProperty]
    private string novoPadraoNome = string.Empty;

    [ObservableProperty]
    private string novoPadraoDescricao = string.Empty;

    [ObservableProperty]
    private decimal novoPadraoOddMinima = 1.3m;

    [ObservableProperty]
    private decimal novoPadraoOddMaxima = 2.0m;

    [ObservableProperty]
    private decimal novoPadraoOddMedia = 1.5m;

    [ObservableProperty]
    private string novoPadraoPlacar = "0x0";

    [ObservableProperty]
    private decimal novoPadraoAssertividade = 70;

    [ObservableProperty]
    private int novoPadraoTotalJogos = 100;

    [ObservableProperty]
    private int novoPadraoTotalAcertos = 70;

    [ObservableProperty]
    private string novoPadraoLiga = string.Empty;

    [ObservableProperty]
    private int novoPadraoMinutoInicio = 0;

    [ObservableProperty]
    private int novoPadraoMinutoFim = 90;

    [ObservableProperty]
    private string novoPadraoMercadoSelecionado = "Futebol";

    [RelayCommand]
    private async Task LoadPadroesAsync()
    {
        IsLoading = true;
        try
        {
            var todosPadroes = await _padraoService.ObterTodosAsync();
            Padroes.Clear();
            foreach (var padrao in todosPadroes.OrderByDescending(p => p.Assertividade))
            {
                Padroes.Add(padrao);
            }
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private void ToggleNovoPadrao()
    {
        ShowNovoPadrao = !ShowNovoPadrao;
    }

    [RelayCommand]
    private async Task SalvarNovoPadraoAsync()
    {
        if (string.IsNullOrWhiteSpace(NovoPadraoNome))
        {
            await Shell.Current.DisplayAlert("Erro", "Preencha o nome do padrao", "OK");
            return;
        }

        var novoPadrao = new Padrao
        {
            Nome = NovoPadraoNome,
            Descricao = NovoPadraoDescricao,
            OddMinima = NovoPadraoOddMinima,
            OddMaxima = NovoPadraoOddMaxima,
            OddMedia = NovoPadraoOddMedia,
            Placar = NovoPadraoPlacar,
            Assertividade = NovoPadraoAssertividade,
            TotalJogos = NovoPadraoTotalJogos,
            TotalAcertos = NovoPadraoTotalAcertos,
            Liga = NovoPadraoLiga,
            MinutoInicio = NovoPadraoMinutoInicio,
            MinutoFim = NovoPadraoMinutoFim,
            Mercado = Enum.Parse<TipoMercado>(NovoPadraoMercadoSelecionado)
        };

        await _padraoService.CriarAsync(novoPadrao);
        ShowNovoPadrao = false;
        await LoadPadroesAsync();
    }

    [RelayCommand]
    private async Task ExcluirPadraoAsync(Padrao padrao)
    {
        var confirm = await Shell.Current.DisplayAlert(
            "Confirmar",
            $"Deseja excluir o padrao '{padrao.Nome}'?",
            "Sim", "Nao");

        if (confirm)
        {
            await _padraoService.ExcluirAsync(padrao.Id);
            await LoadPadroesAsync();
        }
    }
}
