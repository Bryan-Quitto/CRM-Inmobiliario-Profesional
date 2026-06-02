using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CRM_Inmobiliario.Api.Domain.Entities;

public sealed class ContactDailyTokenUsage
{
    public Guid Id { get; set; }

    [Required]
    public Guid ContactoId { get; set; }
    
    [ForeignKey("ContactoId")]
    public Contacto? Contacto { get; set; }

    [Required]
    public DateTimeOffset Date { get; set; }

    public int TokensUsed { get; set; }
    public int InputTokens { get; set; }
    public int CachedTokens { get; set; }
    public int OutputTokens { get; set; }
    
    [Column(TypeName = "decimal(18, 6)")]
    public decimal CostoUSD { get; set; }

    [Column(TypeName = "decimal(18, 6)")]
    public decimal AhorroUSD { get; set; }
}
