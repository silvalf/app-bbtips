using BBTipsManager.Core.Enums;
using BBTipsManager.Core.Helpers;
using BBTipsManager.Core.Interfaces;
using BBTipsManager.Core.Models;

namespace BBTipsManager.Core.Services;

public class BancaService : IBancaService
{
    private readonly IDataStore _dataStore;
    private const string COLLECTION_NAME = "bancas";

    public BancaService(IDataStore dataStore)
    {
        _dataStore = dataStore;
    }

    public async Task<List<Banca>> ObterTodasAsync()
    {
        return await _dataStore.GetAllAsync<Banca>(COLLECTION_NAME);
    }

    public async Task<Banca?> ObterPorIdAsync(Guid id)
    {
        var bancas = await ObterTodasAsync();
        return bancas.FirstOrDefault(b => b.Id == id);
    }

    public async Task<Banca> CriarAsync(Banca banca)
    {
        banca.Id = Guid.NewGuid();
        banca.DataCriacao = DateTime.Now;
        banca.SaldoAtual = banca.SaldoInicial;
        banca.Status = StatusBanca.Ativa;
        
        await _dataStore.InsertAsync(COLLECTION_NAME, banca);
        return banca;
    }

    public async Task<Banca> AtualizarAsync(Banca banca)
    {
        await _dataStore.UpdateAsync(COLLECTION_NAME, banca.Id, banca);
        return banca;
    }

    public async Task<bool> ExcluirAsync(Guid id)
    {
        return await _dataStore.DeleteFromCollectionAsync(COLLECTION_NAME, id);
    }

    public async Task<Banca> AtualizarSaldoAsync(Guid id, decimal novoSaldo)
    {
        var banca = await ObterPorIdAsync(id);
        if (banca == null)
            throw new Exception("Banca não encontrada");

        banca.SaldoAtual = novoSaldo;
        banca.DataUltimaOperacao = DateTime.Now;

        // Verifica stops
        if (GestaoRisco.VerificarStopLoss(banca))
        {
            banca.Status = StatusBanca.StopLoss;
        }
        else if (GestaoRisco.VerificarStopGain(banca))
        {
            banca.Status = StatusBanca.Meta;
        }

        await AtualizarAsync(banca);
        return banca;
    }

    public async Task<bool> VerificarStopLossAsync(Guid id)
    {
        var banca = await ObterPorIdAsync(id);
        return banca != null && GestaoRisco.VerificarStopLoss(banca);
    }

    public async Task<bool> VerificarStopGainAsync(Guid id)
    {
        var banca = await ObterPorIdAsync(id);
        return banca != null && GestaoRisco.VerificarStopGain(banca);
    }
}
