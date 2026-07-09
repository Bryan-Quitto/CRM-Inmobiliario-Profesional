using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.WhatsApp;

public static class ObtenerLogsIa
{
    public record InteresResumen(
        Guid PropiedadId,
        string Titulo,
        string? ImagenUrl,
        decimal Precio,
        string? Sector,
        string NivelInteres,
        DateTimeOffset Fecha);

    public record ContactGroupResponse(
        string Telefono,
        string Nombre,
        Guid? ContactoId,
        DateTimeOffset UltimaActividad,
        bool RegistradoPorIA,
        List<LogResponse> Logs,
        List<InteresResumen> Intereses);

    public record LogResponse(
        Guid Id,
        string Accion,
        string? DetalleJson,
        string? TriggerMessage,
        DateTimeOffset Fecha);



    public static void MapObtenerLogsIa(this IEndpointRouteBuilder app)
    {
        app.MapGet("/ia/logs", [Microsoft.AspNetCore.Authorization.Authorize] async (
            [Microsoft.AspNetCore.Mvc.FromQuery] string canal, 
            System.Security.Claims.ClaimsPrincipal user, 
            CrmDbContext context, 
            ILogger<CrmDbContext> logger) =>
        {
            canal ??= "WhatsApp";

            var agenteIdStr = user.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(agenteIdStr, out var agenteId))
                return Results.Unauthorized();

            
            try 
            {
                var rawLogs = await context.AiActionLogs
                    .AsNoTracking()
                    .Where(l => l.Canal == canal && (l.ContactoId == null || !context.AgentArchivedContacts.Any(a => a.ContactoId == l.ContactoId && a.AgentId == agenteId)))
                    .Where(l => 
                        (l.ContactoId != null && context.Contactos.Any(c => c.Id == l.ContactoId && c.AgenteId == agenteId)) ||
                        (l.ContactoId == null && canal == "WhatsApp" && context.WhatsappMessages.Any(m => m.Telefono == l.TelefonoContacto && m.AgenteId == agenteId)) ||
                        (l.ContactoId == null && canal == "Facebook" && context.FacebookMessages.Any(m => m.FacebookSenderId == l.TelefonoContacto && m.AgenteId == agenteId))
                    )
                    .OrderByDescending(l => l.Fecha)
                    .Take(400)
                    .ToListAsync();

                var activities = rawLogs.Select(l => new { 
                    l.ContactoId, 
                    TelefonoContacto = l.TelefonoContacto, 
                    l.Fecha, 
                    LogId = (Guid?)l.Id, 
                    l.Accion, 
                    l.DetalleJson, 
                    l.TriggerMessage 
                }).ToList();

                if (canal == "WhatsApp")
                {
                    var recentWa = await context.WhatsappMessages.AsNoTracking()
                        .Where(m => m.AgenteId == agenteId)
                        .Where(m => m.ContactoId == null || !context.AgentArchivedContacts.Any(a => a.ContactoId == m.ContactoId && a.AgentId == agenteId))
                        .OrderByDescending(m => m.Fecha).Take(400).ToListAsync();
                    activities.AddRange(recentWa.Select(m => new { 
                        ContactoId = (Guid?)m.ContactoId, 
                        TelefonoContacto = m.Telefono, 
                        m.Fecha, 
                        LogId = (Guid?)null, 
                        Accion = "Chat", 
                        DetalleJson = (string?)null, 
                        TriggerMessage = (string?)null 
                    }));
                }
                else if (canal == "Facebook")
                {
                    var recentFb = await context.FacebookMessages.AsNoTracking()
                        .Where(m => m.AgenteId == agenteId)
                        .Where(m => m.ContactoId == null || !context.AgentArchivedContacts.Any(a => a.ContactoId == m.ContactoId && a.AgentId == agenteId))
                        .OrderByDescending(m => m.Fecha).Take(400).ToListAsync();
                    activities.AddRange(recentFb.Select(m => new { 
                        ContactoId = (Guid?)m.ContactoId, 
                        TelefonoContacto = m.FacebookSenderId, 
                        m.Fecha, 
                        LogId = (Guid?)null, 
                        Accion = "Chat", 
                        DetalleJson = (string?)null, 
                        TriggerMessage = (string?)null 
                    }));
                }

                var groupedActivities = activities
                    .OrderByDescending(a => a.Fecha)
                    .GroupBy(a => new { 
                        ContactoId = a.ContactoId, 
                        TelefonoContacto = a.ContactoId.HasValue ? null : a.TelefonoContacto
                    })
                    .ToList();

                var contactoIds = groupedActivities.Where(g => g.Key.ContactoId.HasValue).Select(g => g.Key.ContactoId!.Value).Distinct().ToList();
                var telefonos = groupedActivities
                    .Select(g => g.Key.TelefonoContacto ?? g.First().TelefonoContacto)
                    .Where(t => !string.IsNullOrWhiteSpace(t))
                    .Select(t => t!)
                    .Distinct()
                    .ToList();

                var contactos = await context.Contactos
                    .AsNoTracking()
                    .Where(c => contactoIds.Contains(c.Id) || 
                                (canal == "WhatsApp" && telefonos.Contains(c.Telefono!)) ||
                                (canal == "Facebook" && telefonos.Contains(c.FacebookSenderId!)))
                    .Select(c => new {
                        c.Id,
                        c.Nombre,
                        c.Apellido,
                        c.Origen,
                        c.FechaCreacion,
                        c.Telefono,
                        c.FacebookSenderId,
                        Intereses = c.PropertyInterests
                            .Where(i => i.Propiedad != null)
                            .Select(i => new InteresResumen(
                                i.PropiedadId,
                                i.Propiedad!.Titulo,
                                i.Propiedad.Media.OrderBy(m => m.Orden).Select(m => m.StoragePath).FirstOrDefault(),
                                i.Propiedad.Precio,
                                i.Propiedad.Sector,
                                i.NivelInteres,
                                i.FechaRegistro
                            )).ToList()
                    })
                    .ToListAsync();

                var contactsById = contactos.ToDictionary(c => c.Id);
                var contactsByPhone = canal == "WhatsApp" 
                    ? contactos.Where(c => !string.IsNullOrWhiteSpace(c.Telefono)).OrderByDescending(c => c.FechaCreacion).GroupBy(c => c.Telefono!).ToDictionary(g => g.Key, g => g.First())
                    : contactos.Where(c => !string.IsNullOrWhiteSpace(c.FacebookSenderId)).OrderByDescending(c => c.FechaCreacion).GroupBy(c => c.FacebookSenderId!).ToDictionary(g => g.Key, g => g.First());

                var response = groupedActivities
                    .Select(g => {
                        var firstActivity = g.First();
                        var cid = g.Key.ContactoId;
                        var phone = g.Key.TelefonoContacto ?? firstActivity.TelefonoContacto;
                        
                        var contact = cid.HasValue && contactsById.ContainsKey(cid.Value) 
                            ? contactsById[cid.Value] 
                            : (!string.IsNullOrWhiteSpace(phone) && contactsByPhone.ContainsKey(phone) ? contactsByPhone[phone] : null);

                        bool registradoPorIA = contact != null && (contact.Origen == "IA WhatsApp" || 
                                               contact.Origen == "Aut. WhatsApp" || 
                                               contact.Origen == "Aut. Facebook");

                        var ultimaActividad = firstActivity.Fecha;
                        
                        var logs = g.Where(a => a.LogId.HasValue).Select(a => new LogResponse(a.LogId!.Value, a.Accion, a.DetalleJson, a.TriggerMessage, a.Fecha)).ToList();
                        
                        string nombreAMostrar = contact != null 
                            ? $"{contact.Nombre} {contact.Apellido}".Trim() 
                            : "Contacto no identificado";
                            
                        if (string.IsNullOrWhiteSpace(nombreAMostrar)) nombreAMostrar = "Contacto sin nombre";



                        return new ContactGroupResponse(
                            phone ?? contact?.Telefono ?? contact?.FacebookSenderId ?? "",
                            nombreAMostrar,
                            contact?.Id ?? cid,
                            ultimaActividad,
                            registradoPorIA,
                            logs,
                            contact?.Intereses ?? new List<InteresResumen>()
                        );
                    })
                    .GroupBy(r => new { r.ContactoId, r.Telefono })
                    .Select(g => g.First() with {
                        Logs = g.SelectMany(x => x.Logs).OrderByDescending(l => l.Fecha).ToList(),
                        UltimaActividad = g.Max(x => x.UltimaActividad)
                    })
                    .OrderByDescending(r => r.UltimaActividad)
                    .ToList();

                return Results.Ok(response);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error al recuperar logs agrupados");
                return Results.Problem("Error interno.");
            }
        })
        .WithName("ObtenerLogsIa")
        .WithTags("IA")
        .RequireAuthorization();
    }
}
