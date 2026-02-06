using Microsoft.AspNetCore.Mvc;
using System.Data.SqlClient;

namespace BBTips.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public HealthController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [HttpGet]
    public async Task<IActionResult> GetHealth()
    {
        var databaseStatus = "Checking...";
        var databaseMessage = "";
        var serverName = "";

        // Test SQL Server connection
        try
        {
            var connectionString = _configuration.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();
            
            // Test query
            using var command = new SqlCommand("SELECT 1", connection);
            await command.ExecuteScalarAsync();

            databaseStatus = "Connected";
            serverName = "LUIZSILVA\\SQLEXPRESS";
        }
        catch (Exception ex)
        {
            databaseStatus = "Error";
            databaseMessage = ex.Message;
        }

        var response = new
        {
            Status = databaseStatus == "Connected" ? "Healthy" : "Unhealthy",
            Timestamp = DateTime.UtcNow.ToString("o"),
            Services = new
            {
                Backend = new
                {
                    Status = "Running",
                    Version = "1.0.0"
                },
                Database = new
                {
                    Status = databaseStatus,
                    Type = "SQL Server",
                    Server = serverName,
                    Message = databaseMessage
                }
            }
        };

        return Ok(response);
    }

    [HttpGet("database")]
    public async Task<IActionResult> DatabaseHealth()
    {
        try
        {
            var connectionString = _configuration.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();
            
            using var command = new SqlCommand("SELECT 1", connection);
            await command.ExecuteScalarAsync();

            return Ok(new
            {
                Status = "Connected",
                Type = "SQL Server",
                Message = "Database connection is healthy"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                Status = "Error",
                Type = "SQL Server",
                Message = ex.Message
            });
        }
    }
}
