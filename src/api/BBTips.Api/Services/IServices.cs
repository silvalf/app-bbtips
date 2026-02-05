namespace BBTips.Api.Services;

public interface IUnitOfWork : IDisposable
{
    Task<int> SaveChangesAsync();
}

public interface IBotService
{
    Task<List<Bot>> GetAllBots();
    Task<Bot?> GetBotById(int id);
    Task<Bot> CreateBot(CreateBotRequest request);
    Task<bool> UpdateBot(int id, UpdateBotRequest request);
    Task<bool> DeleteBot(int id);
}

public interface ILogService
{
    Task<List<Log>> GetLogs();
    Task<Log> AddLog(string level, string message, string? details);
}
