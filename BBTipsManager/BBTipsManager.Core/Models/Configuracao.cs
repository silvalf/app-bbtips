namespace BBTipsManager.Core.Models;

public class CredencialBBTips
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Senha { get; set; } = string.Empty;
    public string UrlBase { get; set; } = "https://app.bbtips.com.br";
    public int TimeoutSegundos { get; set; } = 30;
    public bool ModoDebug { get; set; }
    public bool EhPrincipal { get; set; }
    public bool Ativa { get; set; } = true;
    public DateTime DataCriacao { get; set; } = DateTime.Now;
    public DateTime DataAtualizacao { get; set; } = DateTime.Now;
}

public class ConfiguracaoGeral
{
    public int Id { get; set; }
    public bool NotificacoesAtivas { get; set; } = true;
    public bool SomAlerta { get; set; } = true;
    public int IntervaloAtualizacao { get; set; } = 5;
    public string TemaAplicacao { get; set; } = "Dark";
    public bool IniciarComWindows { get; set; }
    public string CaminhoBancoDados { get; set; } = string.Empty;
    public Guid? CredencialBBTipsId { get; set; }
    public DateTime DataCriacao { get; set; } = DateTime.Now;
    public DateTime DataAtualizacao { get; set; } = DateTime.Now;
}
