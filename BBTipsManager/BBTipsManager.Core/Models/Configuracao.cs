namespace BBTipsManager.Core.Models;

public class ConfiguracaoBBTips
{
    public string Email { get; set; } = string.Empty;
    public string Senha { get; set; } = string.Empty;
    public string UrlBase { get; set; } = "https://app.bbtips.com.br";
    public bool LembrarCredenciais { get; set; }
    public bool AutoLogin { get; set; }
    public int TimeoutSegundos { get; set; } = 30;
    public bool ModoDebug { get; set; }
}

public class ConfiguracaoGeral
{
    public bool NotificacoesAtivas { get; set; } = true;
    public bool SomAlerta { get; set; } = true;
    public int IntervaloAtualizacao { get; set; } = 5;       // Segundos
    public string TemaAplicacao { get; set; } = "Dark";
    public bool IniciarComWindows { get; set; }
    public string CaminhoBancoDados { get; set; } = string.Empty;
}
