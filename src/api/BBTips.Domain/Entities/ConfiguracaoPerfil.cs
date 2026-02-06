using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BBTips.Domain.Entities;

public class ConfiguracaoPerfil
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public bool NotificacoesAtivas { get; set; } = true;
    
    [Required]
    public bool SomAlerta { get; set; } = true;
    
    [Required]
    public int IntervaloAtualizacao { get; set; } = 5;
    
    [Required]
    [MaxLength(50)]
    public string TemaAplicacao { get; set; } = "Dark";
    
    [Required]
    public bool IniciarComWindows { get; set; } = false;
    
    [MaxLength(500)]
    public string? CaminhoBancoDados { get; set; }
    
    public Guid? CredencialBBTipsId { get; set; }
    
    [Required]
    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
    
    [Required]
    public DateTime DataAtualizacao { get; set; } = DateTime.UtcNow;
}
