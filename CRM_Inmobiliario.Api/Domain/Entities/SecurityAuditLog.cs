using System;

namespace CRM_Inmobiliario.Api.Domain.Entities;

public sealed class SecurityAuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AgenteId { get; set; }
    public string TipoIncidente { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public DateTimeOffset Timestamp { get; set; } = DateTimeOffset.UtcNow;

    public Agent Agente { get; set; } = null!;
}
