using BBTipsManager.Core.Enums;
using BBTipsManager.Core.Interfaces;
using BBTipsManager.Core.Models;

namespace BBTipsManager.Core.Services;

public class PadraoService : IPadraoService
{
    private readonly IDataStore _dataStore;
    private const string COLLECTION_NAME = "padroes";

    public PadraoService(IDataStore dataStore)
    {
        _dataStore = dataStore;
    }

    public async Task<List<Padrao>> ObterTodosAsync()
    {
        return await _dataStore.GetAllAsync<Padrao>(COLLECTION_NAME);
    }

    public async Task<Padrao> CriarAsync(Padrao padrao)
    {
        padrao.Id = Guid.NewGuid();
        padrao.DataCriacao = DateTime.Now;
        padrao.Ativo = true;
        
        await _dataStore.InsertAsync(COLLECTION_NAME, padrao);
        return padrao;
    }

    public async Task<Padrao> AtualizarAsync(Padrao padrao)
    {
        await _dataStore.UpdateAsync(COLLECTION_NAME, padrao.Id, padrao);
        return padrao;
    }

    public async Task<bool> ExcluirAsync(Guid id)
    {
        return await _dataStore.DeleteFromCollectionAsync(COLLECTION_NAME, id);
    }

    public async Task<List<Padrao>> ObterPorMercadoAsync(int mercadoId)
    {
        var padroes = await ObterTodosAsync();
        return padroes.Where(p => (int)p.Mercado == mercadoId && p.Ativo).ToList();
    }
}
