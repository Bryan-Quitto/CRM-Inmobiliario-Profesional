using System.ComponentModel.DataAnnotations;

namespace CRM_Inmobiliario.Api.Domain.Entities;

public sealed class WhatsappConversation
{
    public Guid Id { get; set; }

    [Required]
    public Guid ContactoId { get; set; }
    public Contacto? Contacto { get; set; }

    [MaxLength(20)]
    public string Telefono { get; set; } = string.Empty;

    public string HistorialJson { get; set; } = "[]";

    public DateTimeOffset UltimaActualizacion { get; set; } = DateTimeOffset.UtcNow;
}
