using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Linq;
using BBTips.Domain.Interfaces;

namespace BBTips.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OddsController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly string _connectionString;

    public OddsController(IConfiguration configuration)
    {
        _configuration = configuration;
        _connectionString = _configuration.GetConnectionString("DefaultConnection") 
            ?? "Server=localhost;Database=BBTipsDB;Trusted_Connection=True;TrustServerCertificate=True;";
    }

    /// <summary>
    /// GET /api/odds/copa
    /// Retorna odds médias da Copa do Mundo
    /// </summary>
    [HttpGet("copa")]
    public async Task<IActionResult> GetOddsCopa()
    {
        return await GetOddsPorTabela("tbl_odds_medias_fut_copa");
    }

    /// <summary>
    /// GET /api/odds/euro
    /// Retorna odds médias do Eurocopa
    /// </summary>
    [HttpGet("euro")]
    public async Task<IActionResult> GetOddsEuro()
    {
        return await GetOddsPorTabela("tbl_odds_medias_fut_euro");
    }

    /// <summary>
    /// GET /api/odds/premier
    /// Retorna odds médias da Premier League
    /// </summary>
    [HttpGet("premier")]
    public async Task<IActionResult> GetOddsPremier()
    {
        return await GetOddsPorTabela("tbl_odds_medias_fut_Premier");
    }

    /// <summary>
    /// GET /api/odds/super
    /// Retorna odds médias da Super Liga
    /// </summary>
    [HttpGet("super")]
    public async Task<IActionResult> GetOddsSuper()
    {
        return await GetOddsPorTabela("tbl_odds_medias_fut_Super");
    }

    /// <summary>
    /// GET /api/odds/medias
    /// Retorna todas as odds médias
    /// </summary>
    [HttpGet("medias")]
    public async Task<IActionResult> GetOddsMedias()
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var results = new OddsMediasResponse
            {
                copa = await GetOddsLista(connection, "tbl_odds_medias_fut_copa"),
                euro = await GetOddsLista(connection, "tbl_odds_medias_fut_euro"),
                premier = await GetOddsLista(connection, "tbl_odds_medias_fut_Premier"),
                super = await GetOddsLista(connection, "tbl_odds_medias_fut_Super")
            };

            return Ok(results);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    /// <summary>
    /// GET /api/odds/calcular-media
    /// Calcula a odd média de um conjunto de jogos
    /// </summary>
    [HttpPost("calcular-media")]
    public async Task<IActionResult> CalcularMedia([FromBody] CalcularMediaRequest request)
    {
        try
        {
            if (request == null || request.Odds == null || request.Odds.Count == 0)
            {
                return BadRequest(new { success = false, error = "Nenhuma odd fornecida" });
            }

            // Calcular médias usando LINQ
            var oddsList = request.Odds;
            var mediaVitoriaMandante = oddsList.Count > 0 ? oddsList.Average(o => o.OddVitoriaMandante) : 0;
            var mediaEmpate = oddsList.Count > 0 ? oddsList.Average(o => o.OddEmpate) : 0;
            var mediaVitoriaVisitante = oddsList.Count > 0 ? oddsList.Average(o => o.OddVitoriaVisitante) : 0;
            var mediaOver25 = oddsList.Count > 0 ? oddsList.Average(o => o.OddOver25) : 0;
            var mediaUnder25 = oddsList.Count > 0 ? oddsList.Average(o => o.OddUnder25) : 0;
            var mediaAmbasMarcamSim = oddsList.Count > 0 ? oddsList.Average(o => o.OddAmbasMarcamSim) : 0;
            var mediaAmbasMarcamNao = oddsList.Count > 0 ? oddsList.Average(o => o.OddAmbasMarcamNao) : 0;

            // Calcular probabilidades implícitas
            var probVitoriaMandante = mediaVitoriaMandante > 0 ? (100 / mediaVitoriaMandante) : 0;
            var probEmpate = mediaEmpate > 0 ? (100 / mediaEmpate) : 0;
            var probVitoriaVisitante = mediaVitoriaVisitante > 0 ? (100 / mediaVitoriaVisitante) : 0;

            return Ok(new
            {
                sucesso = true,
                quantidade_jogos = oddsList.Count,
                medias = new
                {
                    odd_vitoria_mandante = Math.Round(mediaVitoriaMandante, 2),
                    odd_empate = Math.Round(mediaEmpate, 2),
                    odd_vitoria_visitante = Math.Round(mediaVitoriaVisitante, 2),
                    odd_over_25 = Math.Round(mediaOver25, 2),
                    odd_under_25 = Math.Round(mediaUnder25, 2),
                    odd_ambos_marcam_sim = Math.Round(mediaAmbasMarcamSim, 2),
                    odd_ambos_marcam_nao = Math.Round(mediaAmbasMarcamNao, 2)
                },
                probabilidades_implicitas = new
                {
                    mandante = Math.Round(probVitoriaMandante, 2),
                    empate = Math.Round(probEmpate, 2),
                    visitante = Math.Round(probVitoriaVisitante, 2)
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    private async Task<IActionResult> GetOddsPorTabela(string tabela)
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var results = await GetOddsLista(connection, tabela);
            return Ok(results);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }

    private async Task<List<object>> GetOddsLista(SqlConnection connection, string tabela)
    {
        var results = new List<object>();
        
        // Verificar se a tabela existe
        var checkSql = @"
            SELECT COUNT(*) 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = @tableName";
        
        using var checkCommand = new SqlCommand(checkSql, connection);
        checkCommand.Parameters.AddWithValue("@tableName", tabela);
        
        var tableExists = Convert.ToInt32(await checkCommand.ExecuteScalarAsync()) > 0;
        
        if (!tableExists)
        {
            return results;
        }

        var sql = $"SELECT * FROM {tabela} ORDER BY nome_campeonato, time_mandante";
        using var command = new SqlCommand(sql, connection);
        
        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            results.Add(new
            {
                id = reader["id"] ?? 0,
                nome_campeonato = reader["nome_campeonato"]?.ToString() ?? "",
                time_mandante = reader["time_mandante"]?.ToString() ?? "",
                time_visitante = reader["time_visitante"]?.ToString() ?? "",
                data_evento = reader["data_evento"]?.ToString() ?? "",
                odd_vitoria_mandante = reader["odd_vitoria_mandante"] ?? 0,
                odd_empate = reader["odd_empate"] ?? 0,
                odd_vitoria_visitante = reader["odd_vitoria_visitante"] ?? 0,
                odd_over_25 = reader["odd_over_25"] ?? 0,
                odd_under_25 = reader["odd_under_25"] ?? 0,
                odd_ambos_marcam_sim = reader["odd_ambos_marcam_sim"] ?? 0,
                odd_ambos_marcam_nao = reader["odd_ambos_marcam_nao"] ?? 0
            });
        }

        return results;
    }
}

/// <summary>
/// Response para odds médias
/// </summary>
public class OddsMediasResponse
{
    public List<object> copa { get; set; } = new();
    public List<object> euro { get; set; } = new();
    public List<object> premier { get; set; } = new();
    public List<object> @super { get; set; } = new();
}

/// <summary>
/// Request para cálculo de média de odds
/// </summary>
public class CalcularMediaRequest
{
    public List<OddRequest> Odds { get; set; } = new();
}

public class OddRequest
{
    public double OddVitoriaMandante { get; set; }
    public double OddEmpate { get; set; }
    public double OddVitoriaVisitante { get; set; }
    public double OddOver25 { get; set; }
    public double OddUnder25 { get; set; }
    public double OddAmbasMarcamSim { get; set; }
    public double OddAmbasMarcamNao { get; set; }
}
