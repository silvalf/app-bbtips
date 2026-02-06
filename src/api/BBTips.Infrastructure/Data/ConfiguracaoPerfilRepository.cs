using System.Data;
using BBTips.Domain.Entities;
using BBTips.Domain.Interfaces;
using Dapper;
using Microsoft.Extensions.Configuration;

namespace BBTips.Infrastructure.Data;

public class ConfiguracaoPerfilRepository : IConfiguracaoPerfilRepository
{
    private readonly IDbConnection _connection;

    public ConfiguracaoPerfilRepository(DapperContext context)
    {
        _connection = context.CreateConnection();
    }

    public async Task<IEnumerable<ConfiguracaoPerfil>> GetAllAsync()
    {
        var sql = "SELECT * FROM ConfiguracaoPerfil ORDER BY Id";
        return await _connection.QueryAsync<ConfiguracaoPerfil>(sql);
    }

    public async Task<ConfiguracaoPerfil?> GetByIdAsync(int id)
    {
        var sql = "SELECT * FROM ConfiguracaoPerfil WHERE Id = @Id";
        return await _connection.QueryFirstOrDefaultAsync<ConfiguracaoPerfil>(sql, new { Id = id });
    }

    public async Task<ConfiguracaoPerfil?> GetFirstAsync()
    {
        var sql = "SELECT TOP 1 * FROM ConfiguracaoPerfil ORDER BY Id";
        return await _connection.QueryFirstOrDefaultAsync<ConfiguracaoPerfil>(sql);
    }

    public async Task<ConfiguracaoPerfil> CreateAsync(ConfiguracaoPerfil configuracao)
    {
        var sql = @"
            INSERT INTO ConfiguracaoPerfil (NotificacoesAtivas, SomAlerta, IntervaloAtualizacao, TemaAplicacao, IniciarComWindows, CaminhoBancoDados, CredencialBBTipsId, DataCriacao, DataAtualizacao)
            VALUES (@NotificacoesAtivas, @SomAlerta, @IntervaloAtualizacao, @TemaAplicacao, @IniciarComWindows, @CaminhoBancoDados, @CredencialBBTipsId, @DataCriacao, @DataAtualizacao);
            SELECT CAST(SCOPE_IDENTITY() as int);";
        
        var id = await _connection.ExecuteScalarAsync<int>(sql, configuracao);
        configuracao.Id = id;
        return configuracao;
    }

    public async Task<ConfiguracaoPerfil> UpdateAsync(ConfiguracaoPerfil configuracao)
    {
        configuracao.DataAtualizacao = DateTime.UtcNow;
        var sql = @"
            UPDATE ConfiguracaoPerfil 
            SET NotificacoesAtivas = @NotificacoesAtivas, 
                SomAlerta = @SomAlerta, 
                IntervaloAtualizacao = @IntervaloAtualizacao, 
                TemaAplicacao = @TemaAplicacao, 
                IniciarComWindows = @IniciarComWindows, 
                CaminhoBancoDados = @CaminhoBancoDados, 
                CredencialBBTipsId = @CredencialBBTipsId, 
                DataAtualizacao = @DataAtualizacao
            WHERE Id = @Id";
            
        await _connection.ExecuteAsync(sql, configuracao);
        return configuracao;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var sql = "DELETE FROM ConfiguracaoPerfil WHERE Id = @Id";
        var result = await _connection.ExecuteAsync(sql, new { Id = id });
        return result > 0;
    }
}
