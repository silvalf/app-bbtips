using System.Text.Json;
using System.Data;
using BBTips.Infrastructure.Data;
using BBTips.Domain.Interfaces;
using BBTips.Application.Services;
using BBTips.Domain.Entities;
using Dapper;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAll", policy => {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Database (Dapper)
builder.Services.AddSingleton<DapperContext>();

// HTTP Client for Robot API
builder.Services.AddHttpClient();

// Dependency Injection
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IBotService, BotService>();
builder.Services.AddScoped<ILogService, LogService>();
builder.Services.AddScoped<IConfiguracaoPerfilRepository, ConfiguracaoPerfilRepository>();
builder.Services.AddScoped<IConfiguracaoPerfilService, ConfiguracaoPerfilService>();
builder.Services.AddScoped<ICredenciaisBotsRepository, CredenciaisBotsRepository>();
builder.Services.AddScoped<ICredenciaisBotsService, CredenciaisBotsService>();

var app = builder.Build();

// Root endpoint - simple health check
app.MapGet("/", () => Results.Json(new { message = "sucesso!" }));

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "OK", timestamp = DateTime.Now }));

// Listar todos os endpoints disponíveis
app.MapGet("/endpoints", () => {
    var endpoints = app.Services.GetRequiredService<EndpointDataSource>().Endpoints
        .Where(e => e.DisplayName != null)
        .Select(e => e.DisplayName);
    return Results.Ok(new { 
        message = "Lista de todos os endpoints", 
        endpoints = endpoints 
    });
});

// Verificar se endpoint específico existe
app.MapGet("/check-endpoint", (string path) => {
    var endpoints = app.Services.GetRequiredService<EndpointDataSource>().Endpoints
        .Where(e => e.DisplayName != null && e.DisplayName.Contains(path))
        .Select(e => e.DisplayName);
    return Results.Ok(new { 
        searchPath = path,
        found = endpoints.Any(),
        endpoints = endpoints
    });
});

// Endpoint de teste global
app.MapGet("/test-global", () => Results.Ok(new { success = true, message = "Teste global funcionando!", timestamp = DateTime.Now }));

// Endpoint de teste para ResultsCards
app.MapGet("/test-results-cards", () => Results.Ok(new { success = true, message = "ResultsCards controller ativo!", timestamp = DateTime.Now }));

// Endpoint para criar a tabela ResultadosCards
app.MapPost("/api/criar-tabela", async (DapperContext dapperContext) => {
    try {
        using var connection = dapperContext.CreateConnection();
        
        var createTableSql = @"
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ResultadosCards')
        BEGIN
            CREATE TABLE ResultadosCards (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                Titulo NVARCHAR(255),
                Padroes NVARCHAR(50),
                Percentual NVARCHAR(50),
                Sg INT,
                G1 INT,
                G2 INT,
                DataHoraBusca DATETIME,
                DataCriacao DATETIME
            )
        END";
        
        await connection.ExecuteAsync(createTableSql);
        
        return Results.Ok(new { success = true, message = "Tabela ResultadosCards criada ou já existe!" });
    } catch (Exception ex) {
        return Results.BadRequest(new { success = false, error = ex.Message });
    }
});

// Endpoint de inserção de cards - direto no Program.cs para teste
app.MapPost("/api/inserir-cards", async (HttpContext context, DapperContext dapperContext) => {
    try {
        using var reader = new StreamReader(context.Request.Body);
        var body = await reader.ReadToEndAsync();
        
        if (string.IsNullOrEmpty(body)) {
            return Results.BadRequest(new { success = false, error = "Body vazio" });
        }
        
        // Parse JSON para contar cards
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var cards = JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(body, options);
        
        if (cards == null || cards.Count == 0) {
            return Results.BadRequest(new { success = false, error = "Nenhum card encontrado" });
        }
        
        int cardsSalvos = 0;
        using var connection = dapperContext.CreateConnection();
        
        foreach (var card in cards) {
            try {
                var titulo = card.TryGetValue("titulo", out var t) ? t.GetString() : null;
                var padroes = card.TryGetValue("padroes", out var p) ? p.GetString() : null;
                var percentual = card.TryGetValue("percentual", out var perc) ? perc.GetString() : null;
                var sg = card.TryGetValue("sg", out var s) ? s.GetInt32() : 0;
                var g1 = card.TryGetValue("g1", out var g) ? g.GetInt32() : 0;
                var g2 = card.TryGetValue("g2", out var g2el) ? g2el.GetInt32() : 0;
                var dataBuscaStr = card.TryGetValue("data_hora_busca", out var d) ? d.GetString() : null;
                var dataHoraBusca = DateTime.TryParse(dataBuscaStr, out var dt) ? dt : DateTime.Now;
                
                var sql = @"INSERT INTO ResultadosCards (Titulo, Padroes, Percentual, Sg, G1, G2, DataHoraBusca, DataCriacao) 
                           VALUES (@Titulo, @Padroes, @Percentual, @Sg, @G1, @G2, @DataHoraBusca, @DataCriacao)";
                
                await connection.ExecuteAsync(sql, new {
                    Titulo = titulo,
                    Padroes = padroes,
                    Percentual = percentual,
                    Sg = sg,
                    G1 = g1,
                    G2 = g2,
                    DataHoraBusca = dataHoraBusca,
                    DataCriacao = DateTime.Now
                });
                
                cardsSalvos++;
            } catch (Exception ex) {
                Console.WriteLine($"[API] Erro ao processar card: {ex.Message}");
            }
        }
        
        Console.WriteLine($"[API] Cards recebidos: {cards.Count}, Salvos: {cardsSalvos}");
        
        return Results.Ok(new { 
            success = true, 
            message = $"Cards recebidos e salvos!",
            received = cards.Count,
            saved = cardsSalvos
        });
    } catch (Exception ex) {
        Console.WriteLine($"[API] Erro: {ex.Message}\n{ex.StackTrace}");
        return Results.StatusCode(500);
    }
});

// Configure the HTTP request pipeline
app.UseCors("AllowAll");
app.UseSwagger();
app.UseSwaggerUI();

app.UseAuthorization();
app.MapControllers();

app.Run();
