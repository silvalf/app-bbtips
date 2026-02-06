using BBTips.Domain.Entities;

namespace BBTips.Domain.Interfaces;

public interface IConfiguracaoPerfilRepository
{
    Task<IEnumerable<ConfiguracaoPerfil>> GetAllAsync();
    Task<ConfiguracaoPerfil?> GetByIdAsync(int id);
    Task<ConfiguracaoPerfil?> GetFirstAsync();
    Task<ConfiguracaoPerfil> CreateAsync(ConfiguracaoPerfil configuracao);
    Task<ConfiguracaoPerfil> UpdateAsync(ConfiguracaoPerfil configuracao);
    Task<bool> DeleteAsync(int id);
}
