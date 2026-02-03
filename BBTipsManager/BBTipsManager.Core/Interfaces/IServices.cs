using BBTipsManager.Core.Models;

namespace BBTipsManager.Core.Interfaces;

public interface IBancaService
{
    Task<List<Banca>> ObterTodasAsync();
    Task<Banca?> ObterPorIdAsync(Guid id);
    Task<Banca> CriarAsync(Banca banca);
    Task<Banca> AtualizarAsync(Banca banca);
    Task<bool> ExcluirAsync(Guid id);
    Task<Banca> AtualizarSaldoAsync(Guid id, decimal novoSaldo);
    Task<bool> VerificarStopLossAsync(Guid id);
    Task<bool> VerificarStopGainAsync(Guid id);
}

public interface IOperacaoService
{
    Task<Operacao> RegistrarOperacaoAsync(Operacao operacao);
    Task<Operacao> FinalizarOperacaoAsync(Guid id, bool ganhou, decimal? retornoReal = null);
    Task<List<Operacao>> ObterPorBancaAsync(Guid bancaId);
    Task<decimal> CalcularProximaStakeAsync(Guid bancaId, bool gale = false);
}

public interface IPadraoService
{
    Task<List<Padrao>> ObterTodosAsync();
    Task<Padrao> CriarAsync(Padrao padrao);
    Task<Padrao> AtualizarAsync(Padrao padrao);
    Task<bool> ExcluirAsync(Guid id);
    Task<List<Padrao>> ObterPorMercadoAsync(int mercadoId);
}
