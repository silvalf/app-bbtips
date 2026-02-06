using BBTips.Domain.Entities;

namespace BBTips.Domain.Interfaces;

public interface IUnitOfWork
{
    Task<int> SaveChangesAsync();
}

public interface IBotService
{
    Task<IEnumerable<Bot>> GetAllBots();
    Task<Bot?> GetBotById(int id);
    Task<Bot> CreateBot(CreateBotRequest request);
    Task<bool> UpdateBot(int id, UpdateBotRequest request);
    Task<bool> DeleteBot(int id);
}

public interface ILogService
{
    Task<IEnumerable<Log>> GetAllLogs();
    Task<Log?> GetLogById(int id);
    Task<Log> CreateLog(Log log);
    Task<IEnumerable<Log>> GetLogsByLevel(string level);
}

// Request DTOs
public class CreateBotRequest
{
    public string Name { get; set; } = string.Empty;
    public string Platform { get; set; } = string.Empty;
    public string Game { get; set; } = string.Empty;
}

public class UpdateBotRequest
{
    public string? Name { get; set; }
    public string? Platform { get; set; }
    public string? Game { get; set; }
    public string? Status { get; set; }
}
