using System.ComponentModel.DataAnnotations;

namespace CRM_Inmobiliario.Api.Domain.Entities;

public sealed class WhatsappMessage
{
    public Guid Id { get; set; }

    [Required]
    [MaxLength(20)]
    public string Telefono { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Rol { get; set; } = string.Empty; // "user" o "assistant"

    [Required]
    public string Contenido { get; set; } = string.Empty;

    public DateTimeOffset Fecha { get; set; } = DateTimeOffset.UtcNow;
}
