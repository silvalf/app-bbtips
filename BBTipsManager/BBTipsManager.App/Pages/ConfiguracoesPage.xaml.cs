using BBTipsManager.App.ViewModels;

namespace BBTipsManager.App.Pages;

public partial class ConfiguracoesPage : ContentPage
{
    private readonly ConfiguracoesViewModel _viewModel;

    public ConfiguracoesPage(ConfiguracoesViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = _viewModel = viewModel;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _viewModel.LoadConfigCommand.ExecuteAsync(null);
    }
}
