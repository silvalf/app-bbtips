using BBTipsManager.App.ViewModels;

namespace BBTipsManager.App.Pages;

public partial class SimuladorPage : ContentPage
{
    public SimuladorPage(SimuladorViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}
