using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using BBTipsManager.Core.Models;
using BBTipsManager.Core.Interfaces;
using CommunityToolkit.Maui.Core;
using CommunityToolkit.Maui.Alerts;
using System.Diagnostics;
using System.Collections.ObjectModel;

namespace BBTipsManager.App.ViewModels;

public partial class ConfiguracoesViewModel : ObservableObject
{
    private readonly IDataStore _dataStore;
    
    // Estado para controle de feedback visual
    [ObservableProperty]
    private bool _hasError;

    [ObservableProperty]
    private string _errorMessage = string.Empty;

    [ObservableProperty]
    private AlertSeverity _currentAlertSeverity = AlertSeverity.None;

    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private CredencialBBTips? _credencialSelecionada;

    // ============ Lista de Credenciais ============
    [ObservableProperty]
    private ObservableCollection<CredencialBBTips> _credenciais = new();

    // ============ Credencial em Edição ============
    [ObservableProperty]
    private string _credencialNome = string.Empty;

    [ObservableProperty]
    private string _credencialEmail = string.Empty;

    [ObservableProperty]
    private string _credencialSenha = string.Empty;

    [ObservableProperty]
    private string _credencialUrlBase = "https://app.bbtips.com.br";

    [ObservableProperty]
    private int _credencialTimeoutSegundos = 30;

    [ObservableProperty]
    private bool _credencialModoDebug;

    [ObservableProperty]
    private bool _credencialEhPrincipal;

    [ObservableProperty]
    private bool _credencialAtiva = true;

    // ============ Config Geral ============
    [ObservableProperty]
    private bool _notificacoesAtivas = true;

    [ObservableProperty]
    private bool _somAlerta = true;

    [ObservableProperty]
    private int _intervaloAtualizacao = 5;

    [ObservableProperty]
    private string _temaAplicacao = "Dark";

    [ObservableProperty]
    private bool _iniciarComWindows;

    [ObservableProperty]
    private bool _isSaving;

    public ConfiguracoesViewModel(IDataStore dataStore)
    {
        _dataStore = dataStore;
    }

    [RelayCommand]
    private async Task LoadConfigAsync()
    {
        IsLoading = true;
        try
        {
            // Carregar lista de credenciais
            var credenciaisList = await _dataStore.GetAllAsync<CredencialBBTips>("credenciais");
            Credenciais = new ObservableCollection<CredencialBBTips>(credenciaisList);

            // Carregar credencial principal
            var credencialPrincipal = await _dataStore.GetAsync<CredencialBBTips>("credencial_principal");
            if (credencialPrincipal != null)
            {
                CredencialSelecionada = credencialPrincipal;
                PreencherFormularioCredencial(credencialPrincipal);
            }
            else if (Credenciais.Count > 0)
            {
                // Se não tem principal definida, usa a primeira
                CredencialSelecionada = Credenciais.FirstOrDefault();
                if (CredencialSelecionada != null)
                {
                    PreencherFormularioCredencial(CredencialSelecionada);
                }
            }

            // Carregar configurações gerais
            var configGeral = await _dataStore.GetAsync<ConfiguracaoGeral>("config_geral");
            if (configGeral != null)
            {
                NotificacoesAtivas = configGeral.NotificacoesAtivas;
                SomAlerta = configGeral.SomAlerta;
                IntervaloAtualizacao = configGeral.IntervaloAtualizacao;
                TemaAplicacao = configGeral.TemaAplicacao;
                IniciarComWindows = configGeral.IniciarComWindows;
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Erro ao carregar configurações: {ex.Message}");
            await ShowSnackbarAsync($"Erro ao carregar: {ex.Message}", AlertSeverity.Error);
            HasError = true;
            ErrorMessage = ex.Message;
            CurrentAlertSeverity = AlertSeverity.Error;
        }
        finally
        {
            IsLoading = false;
        }
    }

    private void PreencherFormularioCredencial(CredencialBBTips credencial)
    {
        CredencialNome = credencial.Nome;
        CredencialEmail = credencial.Email;
        CredencialSenha = credencial.Senha;
        CredencialUrlBase = credencial.UrlBase;
        CredencialTimeoutSegundos = credencial.TimeoutSegundos;
        CredencialModoDebug = credencial.ModoDebug;
        CredencialEhPrincipal = credencial.EhPrincipal;
        CredencialAtiva = credencial.Ativa;
    }

    [RelayCommand]
    private void LimparFormularioCredencial()
    {
        CredencialNome = string.Empty;
        CredencialEmail = string.Empty;
        CredencialSenha = string.Empty;
        CredencialUrlBase = "https://app.bbtips.com.br";
        CredencialTimeoutSegundos = 30;
        CredencialModoDebug = false;
        CredencialEhPrincipal = false;
        CredencialAtiva = true;
        CredencialSelecionada = null;
    }

    [RelayCommand]
    private async Task SalvarCredencialAsync()
    {
        if (string.IsNullOrWhiteSpace(CredencialNome) || string.IsNullOrWhiteSpace(CredencialEmail))
        {
            await ShowSnackbarAsync("Nome e E-mail são obrigatórios", AlertSeverity.Warning);
            return;
        }

        IsSaving = true;
        try
        {
            var credencial = new CredencialBBTips
            {
                Id = CredencialSelecionada?.Id ?? Guid.NewGuid(),
                Nome = CredencialNome,
                Email = CredencialEmail,
                Senha = CredencialSenha,
                UrlBase = CredencialUrlBase,
                TimeoutSegundos = CredencialTimeoutSegundos,
                ModoDebug = CredencialModoDebug,
                EhPrincipal = CredencialEhPrincipal,
                Ativa = CredencialAtiva
            };

            bool success;
            if (CredencialSelecionada != null)
            {
                success = await _dataStore.UpdateAsync("credenciais", credencial.Id, credencial);
            }
            else
            {
                success = await _dataStore.InsertAsync("credenciais", credencial);
            }

            if (success)
            {
                await ShowSnackbarAsync("Credencial salva com sucesso!", AlertSeverity.Success);
                await LoadConfigAsync();
                LimparFormularioCredencialCommand.Execute(null);
            }
            else
            {
                await ShowSnackbarAsync("Erro ao salvar credencial", AlertSeverity.Error);
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Erro ao salvar credencial: {ex.Message}");
            await ShowSnackbarAsync($"Erro ao salvar: {ex.Message}", AlertSeverity.Error);
        }
        finally
        {
            IsSaving = false;
        }
    }

    [RelayCommand]
    private async Task ExcluirCredencialAsync(CredencialBBTips credencial)
    {
        if (Credenciais.Count <= 1)
        {
            await ShowSnackbarAsync("Não é possível excluir a única credencial", AlertSeverity.Warning);
            return;
        }

        var confirm = await Shell.Current.DisplayAlert(
            "Confirmar Exclusão",
            $"Deseja realmente excluir a credencial '{credencial.Nome}'?",
            "Sim", "Não");

        if (!confirm) return;

        IsSaving = true;
        try
        {
            var success = await _dataStore.DeleteFromCollectionAsync("credenciais", credencial.Id);
            if (success)
            {
                await ShowSnackbarAsync("Credencial excluída com sucesso!", AlertSeverity.Success);
                await LoadConfigAsync();
            }
            else
            {
                await ShowSnackbarAsync("Erro ao excluir credencial", AlertSeverity.Error);
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Erro ao excluir credencial: {ex.Message}");
            await ShowSnackbarAsync($"Erro ao excluir: {ex.Message}", AlertSeverity.Error);
        }
        finally
        {
            IsSaving = false;
        }
    }

    [RelayCommand]
    private async Task DefinirCredencialPrincipalAsync(CredencialBBTips credencial)
    {
        IsSaving = true;
        try
        {
            // Atualizar a credencial para ser principal
            credencial.EhPrincipal = true;
            var success = await _dataStore.UpdateAsync("credenciais", credencial.Id, credencial);

            if (success)
            {
                await ShowSnackbarAsync("Credencial definida como principal!", AlertSeverity.Success);
                await LoadConfigAsync();
            }
            else
            {
                await ShowSnackbarAsync("Erro ao definir credencial principal", AlertSeverity.Error);
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Erro ao definir credencial principal: {ex.Message}");
            await ShowSnackbarAsync($"Erro: {ex.Message}", AlertSeverity.Error);
        }
        finally
        {
            IsSaving = false;
        }
    }

    [RelayCommand]
    private async Task SelecionarCredencialAsync(CredencialBBTips credencial)
    {
        CredencialSelecionada = credencial;
        PreencherFormularioCredencial(credencial);
    }

    [RelayCommand]
    private async Task SalvarConfiguracoesGeraisAsync()
    {
        IsSaving = true;
        try
        {
            var configGeral = new ConfiguracaoGeral
            {
                NotificacoesAtivas = NotificacoesAtivas,
                SomAlerta = SomAlerta,
                IntervaloAtualizacao = IntervaloAtualizacao,
                TemaAplicacao = TemaAplicacao,
                IniciarComWindows = IniciarComWindows,
                CredencialBBTipsId = CredencialSelecionada?.Id
            };

            var success = await _dataStore.SetAsync("config_geral", configGeral);
            
            if (success)
            {
                await ShowSnackbarAsync("Configurações gerais salvas!", AlertSeverity.Success);
            }
            else
            {
                await ShowSnackbarAsync("Erro ao salvar configurações", AlertSeverity.Error);
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Erro ao salvar configurações gerais: {ex.Message}");
            await ShowSnackbarAsync($"Erro: {ex.Message}", AlertSeverity.Error);
        }
        finally
        {
            IsSaving = false;
        }
    }

    private async Task ShowSnackbarAsync(string message, AlertSeverity severity)
    {
        try
        {
            var snackbarOptions = new SnackbarOptions
            {
                BackgroundColor = severity switch
                {
                    AlertSeverity.Success => Color.FromArgb("#4CAF50"),
                    AlertSeverity.Error => Color.FromArgb("#F44336"),
                    AlertSeverity.Warning => Color.FromArgb("#FF9800"),
                    AlertSeverity.Info => Color.FromArgb("#2196F3"),
                    _ => Color.FromArgb("#323232")
                },
                TextColor = Colors.White,
                CornerRadius = 8
            };

            var snackbar = Snackbar.Make(
                message,
                action: null,
                actionButtonText: "OK",
                duration: TimeSpan.FromSeconds(4),
                visualOptions: snackbarOptions);

            await snackbar.Show();
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Erro ao mostrar snackbar: {ex.Message}");
            await Shell.Current.DisplayAlert(
                severity.ToString().ToUpper(),
                message,
                "OK");
        }
    }
}

public enum AlertSeverity
{
    None,
    Success,
    Error,
    Warning,
    Info
}
