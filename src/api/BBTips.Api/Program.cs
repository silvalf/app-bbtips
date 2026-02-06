using BBTips.Infrastructure.Data;
using BBTips.Domain.Interfaces;
using BBTips.Application.Services;
using BBTips.Domain.Entities;

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

// Configure the HTTP request pipeline
app.UseCors("AllowAll");
app.UseSwagger();
app.UseSwaggerUI();

app.UseAuthorization();
app.MapControllers();

app.Run();
