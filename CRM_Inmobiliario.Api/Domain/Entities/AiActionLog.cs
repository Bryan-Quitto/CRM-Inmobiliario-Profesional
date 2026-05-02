using System.ComponentModel.DataAnnotations;

namespace CRM_Inmobiliario.Api.Domain.Entities;

public sealed class AiActionLog
{
    public Guid Id { get; set; }

    [Required]
    [MaxLength(20)]
    public string TelefonoContacto { get; set; } = string.Empty;

    public Guid? ContactoId { get; set; } // Vínculo fuerte con el Contacto

    [Required]
    [MaxLength(100)]
    public string Accion { get; set; } = string.Empty;

    public string? DetalleJson { get; set; }

    public string? TriggerMessage { get; set; } // El mensaje del usuario que disparó esto

    public DateTimeOffset Fecha { get; set; } = DateTimeOffset.UtcNow;
}
