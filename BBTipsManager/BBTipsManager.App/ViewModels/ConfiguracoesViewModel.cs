using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using BBTipsManager.Core.Models;
using BBTipsManager.Core.Interfaces;

namespace BBTipsManager.App.ViewModels;

public partial class ConfiguracoesViewModel : ObservableObject
{
    private readonly IDataStore _dataStore;
    private const string CONFIG_KEY = "configuracao_bbtips";
    private const string CONFIG_GERAL_KEY = "configuracao_geral";

    public ConfiguracoesViewModel(IDataStore dataStore)
    {
        _dataStore = dataStore;
    }

    // BB Tips Config
    [ObservableProperty]
    private string email = string.Empty;

    [ObservableProperty]
    private string senha = string.Empty;

    [ObservableProperty]
    private bool lembrarCredenciais;

    [ObservableProperty]
    private bool autoLogin;

    // Config Geral
    [ObservableProperty]
    private bool notificacoesAtivas = true;

    [ObservableProperty]
    private bool somAlerta = true;

    [ObservableProperty]
    private string temaAplicacao = "Dark";

    [ObservableProperty]
    private bool isSaving;

    [RelayCommand]
    private async Task LoadConfigAsync()
    {
        var configBBTips = await _dataStore.GetAsync<ConfiguracaoBBTips>(CONFIG_KEY);
        if (configBBTips != null)
        {
            Email = configBBTips.Email;
            Senha = configBBTips.Senha;
            LembrarCredenciais = configBBTips.LembrarCredenciais;
            AutoLogin = configBBTips.AutoLogin;
        }

        var configGeral = await _dataStore.GetAsync<ConfiguracaoGeral>(CONFIG_GERAL_KEY);
        if (configGeral != null)
        {
            NotificacoesAtivas = configGeral.NotificacoesAtivas;
            SomAlerta = configGeral.SomAlerta;
            TemaAplicacao = configGeral.TemaAplicacao;
        }
    }

    [RelayCommand]
    private async Task SalvarConfigAsync()
    {
        IsSaving = true;
        try
        {
            var configBBTips = new ConfiguracaoBBTips
            {
                Email = Email,
                Senha = LembrarCredenciais ? Senha : string.Empty,
                LembrarCredenciais = LembrarCredenciais,
                AutoLogin = AutoLogin
            };
            await _dataStore.SetAsync(CONFIG_KEY, configBBTips);

            var configGeral = new ConfiguracaoGeral
            {
                NotificacoesAtivas = NotificacoesAtivas,
                SomAlerta = SomAlerta,
                TemaAplicacao = TemaAplicacao
            };
            await _dataStore.SetAsync(CONFIG_GERAL_KEY, configGeral);

            await Shell.Current.DisplayAlert("Sucesso", "Configuracoes salvas!", "OK");
        }
        finally
        {
            IsSaving = false;
        }
    }

    [RelayCommand]
    private async Task TestarConexaoAsync()
    {
        if (string.IsNullOrEmpty(Email) || string.IsNullOrEmpty(Senha))
        {
            await Shell.Current.DisplayAlert("Erro", "Preencha email e senha", "OK");
            return;
        }

        // TODO: Implementar teste de conexao com BB Tips
        await Shell.Current.DisplayAlert("Info", 
            "Funcionalidade de conexao automatica sera implementada na proxima versao!", 
            "OK");
    }
}
