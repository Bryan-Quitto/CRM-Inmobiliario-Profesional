using System.ComponentModel.DataAnnotations;

namespace CRM_Inmobiliario.Api.Domain.Entities;

public sealed class AiActionLog
{
    public Guid Id { get; set; }

    [Required]
    [MaxLength(20)]
    public string TelefonoCliente { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Accion { get; set; } = string.Empty;

    public string? DetalleJson { get; set; }

    public DateTimeOffset Fecha { get; set; } = DateTimeOffset.UtcNow;
}
