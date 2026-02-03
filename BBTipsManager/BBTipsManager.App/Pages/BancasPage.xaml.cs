using BBTipsManager.App.ViewModels;

namespace BBTipsManager.App.Pages;

public partial class BancasPage : ContentPage
{
    private readonly BancasViewModel _viewModel;

    public BancasPage(BancasViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = _viewModel = viewModel;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _viewModel.LoadBancasCommand.ExecuteAsync(null);
    }
}
