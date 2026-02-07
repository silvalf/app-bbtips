using Microsoft.AspNetCore.Mvc;
using BBTips.Domain.Entities;
using BBTips.Domain.Interfaces;
using System.Text.Json;

namespace BBTips.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RobotController : ControllerBase
{
    private readonly ICredenciaisBotsService _credenciaisService;
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;
    private static string? _robotProcessId;
    private static List<RobotLogEntry> _robotLogs = new();
    private static DateTime _lastCacheTime = DateTime.MinValue;
    private static RobotCacheData? _cachedData;

    public RobotController(
        ICredenciaisBotsService credenciaisService,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory)
    {
        _credenciaisService = credenciaisService;
        _configuration = configuration;
        _httpClient = httpClientFactory.CreateClient();
        _httpClient.BaseAddress = new Uri("http://localhost:3001");
        _httpClient.Timeout = TimeSpan.FromMinutes(10);
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        try
        {
            var response = await _httpClient.GetAsync("/api/status");
            var content = await response.Content.ReadAsStringAsync();
            return Ok(JsonSerializer.Deserialize<object>(content));
        }
        catch (Exception ex)
        {
            return Ok(new
            {
                isRunning = false,
                logsCount = _robotLogs.Count,
                lastCacheUpdate = _lastCacheTime,
                cacheExpired = (DateTime.Now - _lastCacheTime).TotalMinutes > 30,
                error = ex.Message
            });
        }
    }

    [HttpGet("logs")]
    public async Task<IActionResult> GetLogs([FromQuery] int? lastId = null)
    {
        try
        {
            var url = lastId.HasValue ? $"/api/logs?lastId={lastId}" : "/api/logs";
            var response = await _httpClient.GetAsync(url);
            var content = await response.Content.ReadAsStringAsync();
            return Ok(JsonSerializer.Deserialize<object>(content));
        }
        catch
        {
            var logs = lastId.HasValue
                ? _robotLogs.Where(l => l.Id > lastId).ToList()
                : _robotLogs.TakeLast(100).ToList();
            return Ok(new { logs, lastLogId = _robotLogs.Count });
        }
    }

    [HttpPost("start")]
    public async Task<IActionResult> StartRobot([FromBody] RobotStartRequest request)
    {
        try
        {
            // Obter credenciais
            CredenciaisBots? credencial = null;
            if (request.CredencialId.HasValue)
            {
                credencial = await _credenciaisService.GetByIdAsync(request.CredencialId.Value);
            }
            else
            {
                credencial = await _credenciaisService.GetFirstAsync();
            }

            if (credencial == null)
            {
                return BadRequest(new { error = "Nenhuma credencial encontrada" });
            }

            // Chamar API do Robot com todos os parâmetros da credencial
            var robotRequest = new
            {
                urlBase = credencial.UrlBase,
                email = credencial.Email,
                senha = credencial.Senha,
                timeoutSegundos = credencial.TimeoutSegundos,
                modoDebug = credencial.ModoDebug,
                tipo = request.Tipo
            };

            var response = await _httpClient.PostAsJsonAsync("/api/robot/start", robotRequest);
            
            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadFromJsonAsync<JsonElement>();
                _robotProcessId = result.GetProperty("processId").GetString();
                return Ok(new { success = true, processId = _robotProcessId });
            }
            else
            {
                var error = await response.Content.ReadAsStringAsync();
                return StatusCode(500, new { error = error });
            }
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("stop")]
    public async Task<IActionResult> StopRobot()
    {
        try
        {
            var response = await _httpClient.PostAsync("/api/robot/stop", null);
            
            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadFromJsonAsync<JsonElement>();
                _robotProcessId = null;
                return Ok(new { success = true, cached = true });
            }
            
            return BadRequest(new { error = "Falha ao parar robô" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("cache")]
    public IActionResult SaveToCache([FromBody] RobotCacheData data)
    {
        _cachedData = data;
        _lastCacheTime = DateTime.Now;
        return Ok(new { success = true, cachedAt = _lastCacheTime });
    }

    [HttpGet("cache")]
    public async Task<IActionResult> GetCachedData()
    {
        if (_cachedData == null || IsCacheExpired())
        {
            // Tentar obter do robot
            try
            {
                var response = await _httpClient.GetAsync("/api/cards");
                if (response.IsSuccessStatusCode)
                {
                    var cardsData = await response.Content.ReadFromJsonAsync<JsonElement>();
                    return Ok(new
                    {
                        dadosCards = cardsData.GetProperty("dadosCards"),
                        source = "robot"
                    });
                }
            }
            catch { }
            
            return NotFound(new { error = "Cache expirado ou não existente" });
        }

        return Ok(new
        {
            data = _cachedData,
            cachedAt = _lastCacheTime,
            expiresInMinutes = 30 - (int)(DateTime.Now - _lastCacheTime).TotalMinutes
        });
    }

    [HttpGet("cards")]
    public async Task<IActionResult> GetCards()
    {
        try
        {
            var response = await _httpClient.GetAsync("/api/cards");
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                return Ok(JsonSerializer.Deserialize<object>(content));
            }
            return NotFound(new { error = "Dados dos cards não disponíveis" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private bool IsCacheExpired()
    {
        return (DateTime.Now - _lastCacheTime).TotalMinutes > 30;
    }
}

public class RobotStartRequest
{
    public Guid? CredencialId { get; set; }
    public string Tipo { get; set; } = "buscador";
}

public class RobotLogEntry
{
    public int Id { get; set; }
    public DateTime Timestamp { get; set; }
    public string Level { get; set; } = "";
    public string Message { get; set; } = "";
    public object? Data { get; set; }
}

public class RobotCacheData
{
    public List<RobotLogEntry> Logs { get; set; } = new();
    public DateTime StoppedAt { get; set; }
}
