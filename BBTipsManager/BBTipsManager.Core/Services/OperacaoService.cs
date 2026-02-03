using BBTipsManager.Core.Enums;
using BBTipsManager.Core.Helpers;
using BBTipsManager.Core.Interfaces;
using BBTipsManager.Core.Models;

namespace BBTipsManager.Core.Services;

public class OperacaoService : IOperacaoService
{
    private readonly IDataStore _dataStore;
    private readonly IBancaService _bancaService;
    private const string COLLECTION_NAME = "operacoes";

    public OperacaoService(IDataStore dataStore, IBancaService bancaService)
    {
        _dataStore = dataStore;
        _bancaService = bancaService;
    }

    public async Task<Operacao> RegistrarOperacaoAsync(Operacao operacao)
    {
        operacao.Id = Guid.NewGuid();
        operacao.DataHora = DateTime.Now;
        operacao.Status = StatusOperacao.Pendente;
        
        await _dataStore.InsertAsync(COLLECTION_NAME, operacao);
        return operacao;
    }

    public async Task<Operacao> FinalizarOperacaoAsync(Guid id, bool ganhou, decimal? retornoReal = null)
    {
        var operacoes = await _dataStore.GetAllAsync<Operacao>(COLLECTION_NAME);
        var operacao = operacoes.FirstOrDefault(o => o.Id == id);
        
        if (operacao == null)
            throw new Exception("Operação não encontrada");

        operacao.Status = ganhou ? StatusOperacao.Ganhou : StatusOperacao.Perdeu;
        operacao.RetornoReal = retornoReal ?? (ganhou ? operacao.RetornoPotencial : 0);

        await _dataStore.UpdateAsync(COLLECTION_NAME, id, operacao);

        // Atualiza saldo da banca
        var banca = await _bancaService.ObterPorIdAsync(operacao.BancaId);
        if (banca != null)
        {
            var lucro = operacao.LucroPrejuizo ?? 0;
            await _bancaService.AtualizarSaldoAsync(banca.Id, banca.SaldoAtual + lucro);
        }

        return operacao;
    }

    public async Task<List<Operacao>> ObterPorBancaAsync(Guid bancaId)
    {
        var operacoes = await _dataStore.GetAllAsync<Operacao>(COLLECTION_NAME);
        return operacoes.Where(o => o.BancaId == bancaId).OrderByDescending(o => o.DataHora).ToList();
    }

    public async Task<decimal> CalcularProximaStakeAsync(Guid bancaId, bool gale = false)
    {
        var banca = await _bancaService.ObterPorIdAsync(bancaId);
        if (banca == null)
            throw new Exception("Banca não encontrada");

        // Conta gales consecutivos
        var operacoes = await ObterPorBancaAsync(bancaId);
        var galesConsecutivos = 0;
        
        foreach (var op in operacoes.OrderByDescending(o => o.DataHora))
        {
            if (op.Status == StatusOperacao.Perdeu)
                galesConsecutivos++;
            else
                break;
        }

        return GestaoRisco.CalcularStake(banca, gale, galesConsecutivos);
    }
}
