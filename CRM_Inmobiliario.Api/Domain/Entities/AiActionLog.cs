using System.ComponentModel.DataAnnotations;

namespace CRM_Inmobiliario.Api.Domain.Entities;

public sealed class AiActionLog
{
    public Guid Id { get; set; }

    [Required]
    [MaxLength(20)]
    public string TelefonoCliente { get; set; } = string.Empty;

    public Guid? ClienteId { get; set; } // Vínculo fuerte con el Lead

    [Required]
    [MaxLength(100)]
    public string Accion { get; set; } = string.Empty;

    public string? DetalleJson { get; set; }

    public string? TriggerMessage { get; set; } // El mensaje del usuario que disparó esto

    public DateTimeOffset Fecha { get; set; } = DateTimeOffset.UtcNow;
}
