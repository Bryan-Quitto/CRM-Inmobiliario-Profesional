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
}
