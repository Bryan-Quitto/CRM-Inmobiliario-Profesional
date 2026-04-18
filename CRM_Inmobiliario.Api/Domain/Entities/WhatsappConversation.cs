using System.ComponentModel.DataAnnotations;

namespace CRM_Inmobiliario.Api.Domain.Entities;

public sealed class WhatsappConversation
{
    [Key]
    [MaxLength(20)]
    public string Telefono { get; set; } = string.Empty;

    public string HistorialJson { get; set; } = "[]";

    public DateTimeOffset UltimaActualizacion { get; set; } = DateTimeOffset.UtcNow;
}
