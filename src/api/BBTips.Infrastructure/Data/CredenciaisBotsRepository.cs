using System.Data;
using BBTips.Domain.Entities;
using BBTips.Domain.Interfaces;
using Dapper;
using Microsoft.Extensions.Configuration;

namespace BBTips.Infrastructure.Data;

public class CredenciaisBotsRepository : ICredenciaisBotsRepository
{
    private readonly IDbConnection _connection;

    public CredenciaisBotsRepository(DapperContext context)
    {
        _connection = context.CreateConnection();
    }

    public async Task<IEnumerable<CredenciaisBots>> GetAllAsync()
    {
        var sql = "SELECT * FROM CredenciaisBots ORDER BY DataCriacao DESC";
        return await _connection.QueryAsync<CredenciaisBots>(sql);
    }

    public async Task<CredenciaisBots?> GetByIdAsync(Guid id)
    {
        var sql = "SELECT * FROM CredenciaisBots WHERE Id = @Id";
        return await _connection.QueryFirstOrDefaultAsync<CredenciaisBots>(sql, new { Id = id });
    }

    public async Task<CredenciaisBots?> GetPrincipalAsync()
    {
        var sql = "SELECT TOP 1 * FROM CredenciaisBots WHERE EhPrincipal = 1 ORDER BY DataCriacao DESC";
        return await _connection.QueryFirstOrDefaultAsync<CredenciaisBots>(sql);
    }

    public async Task<CredenciaisBots?> GetFirstAsync()
    {
        var sql = "SELECT TOP 1 * FROM CredenciaisBots ORDER BY DataCriacao DESC";
        return await _connection.QueryFirstOrDefaultAsync<CredenciaisBots>(sql);
    }

    public async Task<CredenciaisBots> CreateAsync(CredenciaisBots credencial)
    {
        var sql = @"
            INSERT INTO CredenciaisBots (Id, Nome, Email, Senha, UrlBase, TimeoutSegundos, ModoDebug, EhPrincipal, Ativa, DataCriacao, DataAtualizacao)
            VALUES (@Id, @Nome, @Email, @Senha, @UrlBase, @TimeoutSegundos, @ModoDebug, @EhPrincipal, @Ativa, @DataCriacao, @DataAtualizacao)";
        
        await _connection.ExecuteAsync(sql, credencial);
        return credencial;
    }

    public async Task<CredenciaisBots> UpdateAsync(CredenciaisBots credencial)
    {
        credencial.DataAtualizacao = DateTime.UtcNow;
        var sql = @"
            UPDATE CredenciaisBots 
            SET Nome = @Nome, 
                Email = @Email, 
                Senha = @Senha, 
                UrlBase = @UrlBase, 
                TimeoutSegundos = @TimeoutSegundos, 
                ModoDebug = @ModoDebug, 
                EhPrincipal = @EhPrincipal, 
                Ativa = @Ativa, 
                DataAtualizacao = @DataAtualizacao
            WHERE Id = @Id";
            
        await _connection.ExecuteAsync(sql, credencial);
        return credencial;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var sql = "DELETE FROM CredenciaisBots WHERE Id = @Id";
        var result = await _connection.ExecuteAsync(sql, new { Id = id });
        return result > 0;
    }
}
