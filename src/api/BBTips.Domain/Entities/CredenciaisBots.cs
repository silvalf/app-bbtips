using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BBTips.Domain.Entities;

public class CredenciaisBots
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public string Nome { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Senha { get; set; }

    [Required]
    [MaxLength(500)]
    public string UrlBase { get; set; } = "https://app.bbtips.com.br";

    [Required]
    public int TimeoutSegundos { get; set; } = 30;

    [Required]
    public bool ModoDebug { get; set; } = false;

    [Required]
    public bool EhPrincipal { get; set; } = false;

    [Required]
    public bool Ativa { get; set; } = true;

    [Required]
    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime DataAtualizacao { get; set; } = DateTime.UtcNow;
}
