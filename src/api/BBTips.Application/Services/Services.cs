using Dapper.Contrib.Extensions;
using BBTips.Domain.Entities;
using BBTips.Domain.Interfaces;
using BBTips.Infrastructure.Data;
using System.Data;

namespace BBTips.Application.Services;

public class UnitOfWork : IUnitOfWork
{
    private readonly IDbConnection _connection;

    public UnitOfWork(DapperContext context)
    {
        _connection = context.CreateConnection();
        _connection.Open();
    }

    public Task<int> SaveChangesAsync()
    {
        return Task.FromResult(0);
    }

    public void Dispose()
    {
        _connection.Close();
        _connection.Dispose();
    }
}

public class BotService : IBotService
{
    private readonly IDbConnection _connection;

    public BotService(DapperContext context)
    {
        _connection = context.CreateConnection();
    }

    public async Task<IEnumerable<Bot>> GetAllBots()
    {
        using var conn = _connection;
        return await conn.GetAllAsync<Bot>();
    }

    public async Task<Bot?> GetBotById(int id)
    {
        using var conn = _connection;
        return await conn.GetAsync<Bot>(id);
    }

    public async Task<Bot> CreateBot(CreateBotRequest request)
    {
        using var conn = _connection;
        var bot = new Bot
        {
            Name = request.Name,
            Platform = request.Platform,
            Game = request.Game,
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };
        bot.Id = await conn.InsertAsync(bot);
        return bot;
    }

    public async Task<bool> UpdateBot(int id, UpdateBotRequest request)
    {
        using var conn = _connection;
        var bot = await conn.GetAsync<Bot>(id);
        if (bot == null)
            return false;

        if (!string.IsNullOrEmpty(request.Name))
            bot.Name = request.Name;
        if (!string.IsNullOrEmpty(request.Platform))
            bot.Platform = request.Platform;
        if (!string.IsNullOrEmpty(request.Game))
            bot.Game = request.Game;
        if (!string.IsNullOrEmpty(request.Status))
            bot.Status = request.Status;
        bot.UpdatedAt = DateTime.UtcNow;

        await conn.UpdateAsync(bot);
        return true;
    }

    public async Task<bool> DeleteBot(int id)
    {
        using var conn = _connection;
        var bot = await conn.GetAsync<Bot>(id);
        if (bot == null)
            return false;
        return await conn.DeleteAsync(bot);
    }
}

public class LogService : ILogService
{
    private readonly IDbConnection _connection;

    public LogService(DapperContext context)
    {
        _connection = context.CreateConnection();
    }

    public async Task<IEnumerable<Log>> GetAllLogs()
    {
        using var conn = _connection;
        return await conn.GetAllAsync<Log>();
    }

    public async Task<Log?> GetLogById(int id)
    {
        using var conn = _connection;
        return await conn.GetAsync<Log>(id);
    }

    public async Task<Log> CreateLog(Log log)
    {
        using var conn = _connection;
        log.Id = await conn.InsertAsync(log);
        return log;
    }

    public async Task<IEnumerable<Log>> GetLogsByLevel(string level)
    {
        using var conn = _connection;
        var allLogs = await conn.GetAllAsync<Log>();
        return allLogs.Where(l => l.Level == level);
    }
}

// ConfiguracaoPerfil Service
public class ConfiguracaoPerfilService : IConfiguracaoPerfilService
{
    private readonly IConfiguracaoPerfilRepository _repository;

    public ConfiguracaoPerfilService(IConfiguracaoPerfilRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<ConfiguracaoPerfil>> GetAllAsync()
    {
        return await _repository.GetAllAsync();
    }

    public async Task<ConfiguracaoPerfil?> GetByIdAsync(int id)
    {
        return await _repository.GetByIdAsync(id);
    }

    public async Task<ConfiguracaoPerfil?> GetFirstAsync()
    {
        return await _repository.GetFirstAsync();
    }

    public async Task<ConfiguracaoPerfil> CreateAsync(ConfiguracaoPerfil configuracao)
    {
        return await _repository.CreateAsync(configuracao);
    }

    public async Task<ConfiguracaoPerfil> UpdateAsync(ConfiguracaoPerfil configuracao)
    {
        return await _repository.UpdateAsync(configuracao);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        return await _repository.DeleteAsync(id);
    }
}

// CredenciaisBots Service
public class CredenciaisBotsService : ICredenciaisBotsService
{
    private readonly ICredenciaisBotsRepository _repository;

    public CredenciaisBotsService(ICredenciaisBotsRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<CredenciaisBots>> GetAllAsync()
    {
        return await _repository.GetAllAsync();
    }

    public async Task<CredenciaisBots?> GetByIdAsync(Guid id)
    {
        return await _repository.GetByIdAsync(id);
    }

    public async Task<CredenciaisBots?> GetPrincipalAsync()
    {
        return await _repository.GetPrincipalAsync();
    }

    public async Task<CredenciaisBots?> GetFirstAsync()
    {
        return await _repository.GetFirstAsync();
    }

    public async Task<CredenciaisBots> CreateAsync(CredenciaisBots credencial)
    {
        return await _repository.CreateAsync(credencial);
    }

    public async Task<CredenciaisBots> UpdateAsync(CredenciaisBots credencial)
    {
        return await _repository.UpdateAsync(credencial);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        return await _repository.DeleteAsync(id);
    }
}
