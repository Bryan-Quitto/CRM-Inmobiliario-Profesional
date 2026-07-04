using System.ComponentModel.DataAnnotations;

namespace CRM_Inmobiliario.Api.Domain.Entities;

/// <summary>
/// Gestiona el acceso al sistema. El Id coincide con el UUID devuelto por Supabase Auth.
/// </summary>
public sealed class Agent
{
    public Guid Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Apellido { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? DireccionFisica { get; set; }

    [MaxLength(2000)]
    public string? PromptPersonalIA { get; set; }

    [MaxLength(20)]
    public string? Telefono { get; set; }

    public Guid? AgenciaId { get; set; }
    public Agency? Agencia { get; set; }

    public Guid? CreatedById { get; set; }
    public Agent? CreatedBy { get; set; }

    [MaxLength(500)]
    public string? FotoUrl { get; set; }

    [MaxLength(500)]
    public string? LogoUrl { get; set; }

    [Required]
    [MaxLength(50)]
    public string Rol { get; set; } = "Agente";

    public bool Activo { get; set; } = true;

    [MaxLength(2000)]
    public string? AiApiKey { get; set; }

    [MaxLength(50)]
    public string? ActiveLLMProvider { get; set; }

    public int DailyTokenLimitPerContact { get; set; } = 50000;

    public int DailyTokenLimitPersonal { get; set; } = 500000;

    public bool IsPersonalAiEnabled { get; set; } = false;

    public bool IsWhatsAppAiEnabled { get; set; } = false;

    public bool AutoCreateWhatsAppContacts { get; set; } = true;

    [MaxLength(50)]
    public string? WhatsAppPhoneNumberId { get; set; }

    // Valid, Invalid, QuotaExhausted
    [MaxLength(50)]
    public string ByokKeyStatus { get; set; } = "Valid";

    // Integración Facebook Messenger — identificador y token por página, no globales
    [MaxLength(50)]
    public string? FacebookPageId { get; set; }

    [MaxLength(500)]
    public string? FacebookPageAccessToken { get; set; }

    [MaxLength(200)]
    public string? FacebookPageName { get; set; }

    public bool IsFacebookAiEnabled { get; set; } = false;

    public bool AutoCreateFacebookContacts { get; set; } = true;

    public int DailyTokenLimitFacebook { get; set; } = 50000;

    // Configuración de Notificaciones
    public int NotifyOverdueTasksIntervalMinutes { get; set; } = 60;
    public int NotifyTodayTasksAdvanceMinutes { get; set; } = 180;
    public int NotifyTodayTasksIntervalMinutes { get; set; } = 60;
    public int NotifyAiHelpTasksIntervalMinutes { get; set; } = 1;
    public int NotifyAiHelpTasksMaxRetries { get; set; } = 3;
    public int NotifyOverdueTasksMaxHours { get; set; } = 24;

    public bool AutoArchivarContactos { get; set; } = false;
    [Range(100, 1095)]
    public int DiasInactividadContactos { get; set; } = 365;

    public bool AutoArchivarPropiedades { get; set; } = false;
    [Range(100, 1095)]
    public int DiasInactividadPropiedades { get; set; } = 365;

    [MaxLength(50)]
    public string? TerminosAceptadosVersion { get; set; }

    public DateTimeOffset FechaCreacion { get; set; } = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5));

    // Relaciones de navegación
    public ICollection<ContactoAgenteCompartido> ContactosCompartidos { get; set; } = new List<ContactoAgenteCompartido>();
    public ICollection<Contacto> Contactos { get; set; } = new List<Contacto>();
    public ICollection<Property> Properties { get; set; } = new List<Property>();
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    public ICollection<Interaction> Interactions { get; set; } = new List<Interaction>();
    public ICollection<AgentPushSubscription> PushSubscriptions { get; set; } = new List<AgentPushSubscription>();
}
