using System;
using System.Collections.Generic;

namespace CRM_Inmobiliario.Api.Features.IA;

public class AuditoriaEventRow
{
    public Guid EventId { get; set; }
    public Guid? ContactoId { get; set; }
    public string? Telefono { get; set; }
    public string? ContactoNombre { get; set; }
    public string? ContactoApellido { get; set; }
    public DateTimeOffset Fecha { get; set; }
    public string Accion { get; set; } = string.Empty;
    public string? DetalleJson { get; set; }
    public string? TriggerMessage { get; set; }
    public string Source { get; set; } = string.Empty;
    public string Canal { get; set; } = string.Empty;
    public string? SenderType { get; set; }
}

public record AuditoriaSessionResponse(
    string SessionKey,
    long SessionId,
    Guid? ContactoId,
    string? Telefono,
    string? ContactoNombre,
    string? ContactoApellido,
    DateTimeOffset InicioSesion,
    DateTimeOffset FinSesion,
    string CanalPrincipal,
    List<AuditoriaEventRow> Eventos
);
