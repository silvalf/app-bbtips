namespace BBTipsManager.Core.Enums;

public enum TipoEstrategia
{
    Conservadora = 1,    // Stop loss rígido, stakes fixas
    Moderada = 2,        // Stop loss flexível, stakes variáveis
    Alavancagem = 3      // Martingale controlado
}

public enum StatusBanca
{
    Ativa = 1,
    Pausada = 2,
    StopLoss = 3,
    Meta = 4
}

public enum StatusOperacao
{
    Pendente = 1,
    Ganhou = 2,
    Perdeu = 3,
    Cancelada = 4
}

public enum TipoMercado
{
    Futebol = 1,
    SpeedWay = 2,
    Galgos = 3,
    Roletas = 4,
    Blaze = 5
}
