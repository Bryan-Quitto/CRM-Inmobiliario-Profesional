namespace CRM_Inmobiliario.Api.Domain.Entities;

/// <summary>
/// Historial de conversación de un contacto en Facebook Messenger.
/// El canal de identificación es el PSID (FacebookSenderId), que es único por página.
/// </summary>
public class FacebookConversation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? ContactoId { get; set; }
    public string FacebookSenderId { get; set; } = string.Empty;
    public string PageId { get; set; } = string.Empty;
    public Guid AgenteId { get; set; }
    public string HistorialJson { get; set; } = "[]";
    public DateTimeOffset UltimaActualizacion { get; set; } = DateTimeOffset.UtcNow;
}
