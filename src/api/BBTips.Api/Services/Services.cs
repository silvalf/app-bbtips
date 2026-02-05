namespace BBTips.Api.Services;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}

public class BotService : IBotService
{
    private readonly ApplicationDbContext _context;

    public BotService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Bot>> GetAllBots()
    {
        return await _context.Bots.ToListAsync();
    }

    public async Task<Bot?> GetBotById(int id)
    {
        return await _context.Bots.FindAsync(id);
    }

    public async Task<Bot> CreateBot(CreateBotRequest request)
    {
        var bot = new Bot
        {
            Name = request.Name,
            Platform = request.Platform,
            Game = request.Game,
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };

        _context.Bots.Add(bot);
        await _context.SaveChangesAsync();

        return bot;
    }

    public async Task<bool> UpdateBot(int id, UpdateBotRequest request)
    {
        var bot = await _context.Bots.FindAsync(id);
        if (bot == null) return false;

        if (request.Name != null) bot.Name = request.Name;
        if (request.Status != null) bot.Status = request.Status;
        bot.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteBot(int id)
    {
        var bot = await _context.Bots.FindAsync(id);
        if (bot == null) return false;

        _context.Bots.Remove(bot);
        await _context.SaveChangesAsync();
        return true;
    }
}

public class LogService : ILogService
{
    private readonly ApplicationDbContext _context;

    public LogService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Log>> GetLogs()
    {
        return await _context.Logs.OrderByDescending(l => l.Timestamp).Take(1000).ToListAsync();
    }

    public async Task<Log> AddLog(string level, string message, string? details)
    {
        var log = new Log
        {
            Level = level,
            Message = message,
            Details = details,
            Timestamp = DateTime.UtcNow
        };

        _context.Logs.Add(log);
        await _context.SaveChangesAsync();

        return log;
    }
}

// Requests
public class CreateBotRequest
{
    public string Name { get; set; } = string.Empty;
    public string Platform { get; set; } = string.Empty;
    public string Game { get; set; } = string.Empty;
}

public class UpdateBotRequest
{
    public string? Name { get; set; }
    public string? Status { get; set; }
}
