using BBTipsManager.App.ViewModels;

namespace BBTipsManager.App.Pages;

public partial class PadroesPage : ContentPage
{
    private readonly PadroesViewModel _viewModel;

    public PadroesPage(PadroesViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = _viewModel = viewModel;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _viewModel.LoadPadroesCommand.ExecuteAsync(null);
    }
}
