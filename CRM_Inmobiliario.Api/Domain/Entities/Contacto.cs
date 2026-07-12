using System.ComponentModel.DataAnnotations;

namespace CRM_Inmobiliario.Api.Domain.Entities;

/// <summary>
/// Gestión de contactos (prospectos, clientes potenciales o propietarios).
/// </summary>
public sealed class Contacto
{
    public Guid Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Apellido { get; set; }

    [EmailAddress]
    [MaxLength(150)]
    public string? Email { get; set; }

    [MaxLength(20)]
    public string? Telefono { get; set; }

    [MaxLength(50)]
    public string Origen { get; set; } = "Directo";

    [MaxLength(50)]
    public string EstadoEmbudo { get; set; } = "Nuevo";

    [Required]
    public bool EsCliente { get; set; } = true;

    [Required]
    [MaxLength(50)]
    public string EstadoPropietario { get; set; } = "Activo";

    [Required]
    public bool EsPropietario { get; set; } = false;

    public bool BotActivoWA { get; set; } = true;
    public bool BotActivoFB { get; set; } = true;
    public string? EstadoIA_WA { get; set; }
    public string? EstadoIA_FB { get; set; }
    public bool TransferenciaNotificada { get; set; } = false;

    // PSID de Facebook Messenger — identificador único del contacto dentro de la página
    [MaxLength(50)]
    public string? FacebookSenderId { get; set; }

    public DateTimeOffset FechaCreacion { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? FechaCierre { get; set; }

    [Required]
    public Guid AgenteId { get; set; }
    public Agent? Agente { get; set; }

    public int NumeroInteracciones { get; set; } = 0;
    public int NumeroIntereses { get; set; } = 0;
    public int NumeroPropiedadesCaptadas { get; set; } = 0;
    public int NumeroReservas { get; set; } = 0;
    public int NumeroCierres { get; set; } = 0;

    public string NormalizedSearchText { get; set; } = string.Empty;

    // ID del job Hangfire de escalación pendiente. Null si no hay escalación activa.
    public string? PendingEscalamientoJobId { get; set; }
    // ID de la TaskItem creada al escalar para poder auto-completarla cuando el agente responde.
    public Guid? PendingEscalamientoTareaId { get; set; }


    // Relaciones de navegación
    public ICollection<ContactoAgenteCompartido> CompartidoCon { get; set; } = new List<ContactoAgenteCompartido>();
    public ICollection<Property> PropertiesOwned { get; set; } = new List<Property>();
    public ICollection<PropertyTransaction> Transactions { get; set; } = new List<PropertyTransaction>();
    public ICollection<ContactoInteresPropiedad> PropertyInterests { get; set; } = new List<ContactoInteresPropiedad>();
    public ICollection<Property> PropertiesClosed { get; set; } = new List<Property>();
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    public ICollection<Interaction> Interactions { get; set; } = new List<Interaction>();
    public ICollection<ContactoHistorialEmbudo> HistorialEmbudo { get; set; } = new List<ContactoHistorialEmbudo>();
}
