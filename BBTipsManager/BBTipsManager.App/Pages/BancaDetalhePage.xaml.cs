using BBTipsManager.App.ViewModels;

namespace BBTipsManager.App.Pages;

public partial class BancaDetalhePage : ContentPage
{
    public BancaDetalhePage(BancaDetalheViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}
