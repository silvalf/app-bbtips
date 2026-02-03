namespace BBTipsManager.App;

public partial class AppShell : Shell
{
    public AppShell()
    {
        InitializeComponent();
        
        // Registra rotas para navegação
        Routing.RegisterRoute(nameof(Pages.BancaDetalhePage), typeof(Pages.BancaDetalhePage));
    }
}
