using System.ComponentModel.DataAnnotations;

namespace CRM_Inmobiliario.Api.Domain.Entities;

public sealed class ContactoHistorialEmbudo
{
    public Guid Id { get; set; }

    [Required]
    public Guid ContactoId { get; set; }
    public Contacto? Contacto { get; set; }

    [MaxLength(50)]
    public string EstadoAnterior { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string EstadoNuevo { get; set; } = string.Empty;

    public DateTimeOffset FechaCambio { get; set; } = DateTimeOffset.UtcNow;
}
