namespace CRM_Inmobiliario.Api.Domain.Entities;

/// <summary>
/// Registro individual de un mensaje en una conversación de Facebook Messenger.
/// Permite auditoría y replay del historial por contacto.
/// </summary>
public class FacebookMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? ContactoId { get; set; }
    public string FacebookSenderId { get; set; } = string.Empty;
    public Guid AgenteId { get; set; }
    public string Rol { get; set; } = string.Empty; // "user" | "assistant"
    public string? OrigenMensaje { get; set; } // "Cliente", "IA", "AgenteHumano"
    public string Contenido { get; set; } = string.Empty;
    public DateTimeOffset Fecha { get; set; } = DateTimeOffset.UtcNow;
}
