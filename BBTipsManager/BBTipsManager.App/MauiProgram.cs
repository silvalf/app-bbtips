using BBTipsManager.Core.Interfaces;
using BBTipsManager.Core.Services;
using BBTipsManager.App.ViewModels;
using BBTipsManager.App.Pages;
using CommunityToolkit.Maui;
using Microsoft.Extensions.Logging;

namespace BBTipsManager.App;

public static class MauiProgram
{
    // Variável para escolher o tipo de storage
    // Use "sqlserver" para usar SQL Server via API, "local" para JSON local
    private const string STORAGE_TYPE = "sqlserver"; 
    private const string API_BASE_URL = "http://localhost:8000/api";

    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .UseMauiCommunityToolkit()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
            });

        // Configurar Data Store baseado no tipo de storage
        if (STORAGE_TYPE == "sqlserver")
        {
            // Usa API com SQL Server
            builder.Services.AddSingleton<IDataStore>(new ApiDataStore(API_BASE_URL));
        }
        else
        {
            // Usa JSON local (padrão anterior)
            var dataPath = Path.Combine(FileSystem.AppDataDirectory, "BBTipsData");
            builder.Services.AddSingleton<IDataStore>(new JsonDataStore(dataPath));
        }

        // Services
        builder.Services.AddSingleton<IBancaService, BancaService>();
        builder.Services.AddSingleton<IPadraoService, PadraoService>();
        builder.Services.AddTransient<IOperacaoService, OperacaoService>();

        // ViewModels
        builder.Services.AddTransient<DashboardViewModel>();
        builder.Services.AddTransient<BancasViewModel>();
        builder.Services.AddTransient<BancaDetalheViewModel>();
        builder.Services.AddTransient<PadroesViewModel>();
        builder.Services.AddTransient<SimuladorViewModel>();
        builder.Services.AddTransient<ConfiguracoesViewModel>();

        // Pages
        builder.Services.AddTransient<DashboardPage>();
        builder.Services.AddTransient<BancasPage>();
        builder.Services.AddTransient<BancaDetalhePage>();
        builder.Services.AddTransient<PadroesPage>();
        builder.Services.AddTransient<SimuladorPage>();
        builder.Services.AddTransient<ConfiguracoesPage>();

#if DEBUG
        builder.Logging.AddDebug();
#endif

        return builder.Build();
    }
}
