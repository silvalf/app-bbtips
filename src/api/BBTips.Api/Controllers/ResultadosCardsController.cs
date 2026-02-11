using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.IO;
using BBTips.Domain.Interfaces;

namespace BBTips.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ResultadosCardsController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly string _connectionString;

    public ResultadosCardsController(IConfiguration configuration)
    {
        _configuration = configuration;
        _connectionString = _configuration.GetConnectionString("DefaultConnection") 
            ?? "Server=localhost;Database=BBTipsDB;Trusted_Connection=True;TrustServerCertificate=True;";
    }
    
    private void Log(string level, string message)
    {
        var timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff");
        var logEntry = $"[{timestamp}] [{level}] {message}";
        Console.WriteLine(logEntry);
        // Also write to a log file
        try {
            var logPath = Path.Combine(Directory.GetCurrentDirectory(), "logs", "api_logs.txt");
            var dir = Path.GetDirectoryName(logPath);
            if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir)) 
                Directory.CreateDirectory(dir);
            System.IO.File.AppendAllText(logPath ?? "api_logs.txt", logEntry + Environment.NewLine);
        } catch { /* Ignore log file errors */ }
    }

    /// <summary>
    /// GET /api/resultados-cards/test
    /// Endpoint de teste para verificar se a rota está funcionando
    /// </summary>
    [HttpGet("test")]
    public IActionResult Test()
    {
        this.Log("INFO", "=== GET /api/resultados-cards/test CHAMADO ===");
        return Ok(new { 
            success = true, 
            message = "Endpoint funcionando!", 
            timestamp = DateTime.Now 
        });
    }
    
    /// <summary>
    /// GET /api/resultados-cards/debug
    /// Endpoint de debug para verificar se o controller está respondendo
    /// </summary>
    [HttpGet("debug")]
    public IActionResult Debug()
    {
        this.Log("INFO", "=== GET /api/resultados-cards/debug CHAMADO ===");
        return Ok(new { 
            success = true, 
            message = "Controller funcionando!", 
            timestamp = DateTime.Now,
            controller = "ResultadosCardsController"
        });
    }
    
    /// <summary>
    /// GET /api/resultados-cards/ping
    /// Endpoint simples para testar conectividade
    /// </summary>
    [HttpGet("ping")]
    public IActionResult Ping()
    {
        return Ok(new { success = true, message = "pong", timestamp = DateTime.Now });
    }
    
    /// <summary>
    /// POST /api/resultados-cards/inserir-lote
    /// Insere múltiplos cards na tabela resultados_cards
    /// </summary>
    [HttpPost("inserir-lote")]
    public async Task<IActionResult> InserirLote()
    {
        try {
            this.Log("INFO", "=== POST /api/resultados-cards/inserir-lote CHAMADO ===");
            
            // Habilitar leitura do body
            Request.EnableBuffering();
            using var reader = new StreamReader(Request.Body, leaveOpen: true);
            var body = await reader.ReadToEndAsync();
            Request.Body.Position = 0;
            
            this.Log("INFO", $"Raw body: {body}");
            
            if (string.IsNullOrEmpty(body))
            {
                this.Log("WARN", "Body vazio");
                return BadRequest(new { success = false, error = "Body vazio" });
            }
            
            // Tentar deserializar
            List<CardDto> cards;
            try {
                var options = new JsonSerializerOptions 
                {
                    PropertyNameCaseInsensitive = true
                };
                cards = JsonSerializer.Deserialize<List<CardDto>>(body, options) 
                    ?? new List<CardDto>();
                this.Log("INFO", $"Deserializado {cards.Count} cards");
                
                for (int i = 0; i < cards.Count; i++) {
                    this.Log("DEBUG", $"Card {i+1}: Titulo={cards[i].Titulo}, SG={cards[i].Sg}, G1={cards[i].G1}, G2={cards[i].G2}");
                }
            }
            catch (Exception ex)
            {
                this.Log("ERROR", $"Erro ao deserializar: {ex.Message}");
                return BadRequest(new { success = false, error = $"Erro ao deserializar: {ex.Message}" });
            }

            if (cards == null || cards.Count == 0)
            {
                this.Log("WARN", "Nenhum card fornecido");
                return BadRequest(new { success = false, error = "Nenhum card fornecido" });
            }

            this.Log("INFO", $"Abrindo conexão com banco...");
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            this.Log("INFO", "Conexão aberta com sucesso");

            var insertedCount = 0;
            var errors = new List<string>();
            
            foreach (var card in cards)
            {
                try
                {
                    this.Log("INFO", $"Inserindo card: {card.Titulo}");
                    
                    var sql = @"INSERT INTO ResultadosCards (titulo, padroes, percentual, sg, g1, g2, DataHoraBusca, liga) VALUES (@titulo, @padroes, @percentual, @sg, @g1, @g2, @DataHoraBusca, @liga)";

                    using var command = new SqlCommand(sql, connection);
                    DateTime dataBusca = card.DataHoraBusca ?? DateTime.Now;
                    
                    command.Parameters.AddWithValue("@titulo", card.Titulo ?? (object)DBNull.Value);
                    command.Parameters.AddWithValue("@padroes", card.Padroes ?? (object)DBNull.Value);
                    command.Parameters.AddWithValue("@percentual", card.Percentual ?? (object)DBNull.Value);
                    command.Parameters.AddWithValue("@sg", card.Sg);
                    command.Parameters.AddWithValue("@g1", card.G1);
                    command.Parameters.AddWithValue("@g2", card.G2);
                    command.Parameters.AddWithValue("@DataHoraBusca", dataBusca);
                    command.Parameters.AddWithValue("@liga", card.Liga ?? (object)DBNull.Value);

                    var result = await command.ExecuteNonQueryAsync();
                    this.Log("INFO", $"Card inserido. Rows: {result}");
                    insertedCount++;
                }
                catch (Exception ex)
                {
                    var errorMsg = $"Erro ao inserir card {card.Titulo}: {ex.Message}";
                    this.Log("ERROR", errorMsg);
                    errors.Add(errorMsg);
                }
            }

            this.Log("INFO", $"Total inserido: {insertedCount}/{cards.Count}");
            
            return Ok(new { success = true, message = $"{insertedCount} cards inseridos", registros_inseridos = insertedCount, erros = errors });
        }
        catch (Exception ex)
        {
            this.Log("ERROR", $"Erro geral: {ex.Message}");
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    /// <summary>
    /// GET /api/resultados-cards/melhores-padroes
    /// Retorna os melhores padrões ordenados por percentual
    /// </summary>
    [HttpGet("melhores-padroes")]
    public async Task<IActionResult> GetMelhoresPadroes([FromQuery] int limit = 20)
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var sql = @"
                SELECT TOP (@limit) 
                    titulo, padroes, percentual, sg, g1, g2, data_hora_busca
                FROM resultados_cards
                ORDER BY 
                    CAST(REPLACE(REPLACE(percentual, '%', ''), ',', '.') AS DECIMAL(10,2)) DESC,
                    data_hora_busca DESC";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@limit", limit);

            var reader = await command.ExecuteReaderAsync();
            var results = new List<CardDto>();

            while (await reader.ReadAsync())
            {
                results.Add(new CardDto
                {
                    Titulo = reader["titulo"]?.ToString(),
                    Padroes = reader["padroes"]?.ToString(),
                    Percentual = reader["percentual"]?.ToString(),
                    Sg = Convert.ToInt32(reader["sg"]),
                    G1 = Convert.ToInt32(reader["g1"]),
                    G2 = Convert.ToInt32(reader["g2"]),
                    DataHoraBusca = reader["data_hora_busca"] as DateTime?
                });
            }

            return Ok(results);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    /// <summary>
    /// GET /api/resultados-cards/resultados-diarios
    /// Retorna resultados agrupados por dia
    /// </summary>
    [HttpGet("resultados-diarios")]
    public async Task<IActionResult> GetResultadosDiarios()
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var sql = @"
                SELECT 
                    CAST(data_hora_busca AS DATE) AS data,
                    COUNT(*) AS total_cards,
                    ROUND(AVG(CAST(REPLACE(REPLACE(percentual, '%', ''), ',', '.') AS DECIMAL(10,2))), 2) AS percentual_medio,
                    SUM(sg) AS total_sg,
                    SUM(g1) AS total_g1,
                    SUM(g2) AS total_g2
                FROM resultados_cards
                WHERE data_hora_busca >= DATEADD(DAY, -30, GETDATE())
                GROUP BY CAST(data_hora_busca AS DATE)
                ORDER BY data DESC";

            using var command = new SqlCommand(sql, connection);
            var reader = await command.ExecuteReaderAsync();
            var results = new List<ResultadoDiarioDto>();

            while (await reader.ReadAsync())
            {
                results.Add(new ResultadoDiarioDto
                {
                    Data = reader["data"]?.ToString() ?? "",
                    TotalCards = Convert.ToInt32(reader["total_cards"]),
                    PercentualMedio = reader["percentual_medio"]?.ToString() ?? "0",
                    TotalSg = Convert.ToInt32(reader["total_sg"]),
                    TotalG1 = Convert.ToInt32(reader["total_g1"]),
                    TotalG2 = Convert.ToInt32(reader["total_g2"])
                });
            }

            return Ok(results);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    /// <summary>
    /// GET /api/resultados-cards/estatisticas
    /// Retorna estatísticas consolidadas
    /// </summary>
    [HttpGet("estatisticas")]
    public async Task<IActionResult> GetEstatisticas()
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var sql = @"
                SELECT 
                    COUNT(*) AS total_cards,
                    ROUND(AVG(CAST(REPLACE(REPLACE(percentual, '%', ''), ',', '.') AS DECIMAL(10,2))), 2) AS percentual_medio,
                    SUM(sg) AS total_sg,
                    SUM(g1) AS total_g1,
                    SUM(g2) AS total_g2,
                    MIN(data_hora_busca) AS primeira_coleta,
                    MAX(data_hora_busca) AS ultima_coleta
                FROM resultados_cards";

            using var command = new SqlCommand(sql, connection);
            var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                return Ok(new
                {
                    totalCards = Convert.ToInt32(reader["total_cards"]),
                    percentualMedio = reader["percentual_medio"]?.ToString() ?? "0",
                    totalSg = Convert.ToInt32(reader["total_sg"]),
                    totalG1 = Convert.ToInt32(reader["total_g1"]),
                    totalG2 = Convert.ToInt32(reader["total_g2"]),
                    primeiraColeta = reader["primeira_coleta"]?.ToString(),
                    ultimaColeta = reader["ultima_coleta"]?.ToString()
                });
            }

            return Ok(new { });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }
}

/// <summary>
/// DTO para cards
/// </summary>
public class CardDto
{
    [JsonPropertyName("titulo")]
    public string? Titulo { get; set; }
    
    [JsonPropertyName("padroes")]
    public string? Padroes { get; set; }
    
    [JsonPropertyName("percentual")]
    public string? Percentual { get; set; }
    
    [JsonPropertyName("sg")]
    public int Sg { get; set; }
    
    [JsonPropertyName("g1")]
    public int G1 { get; set; }
    
    [JsonPropertyName("g2")]
    public int G2 { get; set; }
    
    [JsonPropertyName("data_hora_busca")]
    public DateTime? DataHoraBusca { get; set; }
    
    [JsonPropertyName("liga")]
    public string? Liga { get; set; }
}

/// <summary>
/// DTO para resultados diários
/// </summary>
public class ResultadoDiarioDto
{
    public string Data { get; set; } = "";
    public int TotalCards { get; set; }
    public string PercentualMedio { get; set; } = "0";
    public int TotalSg { get; set; }
    public int TotalG1 { get; set; }
    public int TotalG2 { get; set; }
}
