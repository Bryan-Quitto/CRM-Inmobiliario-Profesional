using System.ComponentModel.DataAnnotations;

namespace CRM_Inmobiliario.Api.Domain.Entities;

/// <summary>
/// Entidad de unión para gestionar la visibilidad compartida de contactos entre agentes.
/// </summary>
public sealed class ContactoAgenteCompartido
{
    [Required]
    public Guid ContactoId { get; set; }
    public Contacto? Contacto { get; set; }

    [Required]
    public Guid AgenteId { get; set; }
    public Agent? Agente { get; set; }

    public DateTimeOffset FechaCompartido { get; set; } = DateTimeOffset.UtcNow;
}
