using BBTips.Domain.Entities;

namespace BBTips.Domain.Interfaces;

public interface ICredenciaisBotsRepository
{
    Task<IEnumerable<CredenciaisBots>> GetAllAsync();
    Task<CredenciaisBots?> GetByIdAsync(Guid id);
    Task<CredenciaisBots?> GetPrincipalAsync();
    Task<CredenciaisBots?> GetFirstAsync();
    Task<CredenciaisBots> CreateAsync(CredenciaisBots credencial);
    Task<CredenciaisBots> UpdateAsync(CredenciaisBots credencial);
    Task<bool> DeleteAsync(Guid id);
}
