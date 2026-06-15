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
        app.MapGet("/ia/logs", [Microsoft.AspNetCore.Authorization.Authorize] async ([Microsoft.AspNetCore.Mvc.FromQuery] string canal, CrmDbContext context, ILogger<CrmDbContext> logger) =>
        {
            canal ??= "WhatsApp";
            logger.LogInformation("--- OBTENIENDO AUDITORÍA IA AGRUPADA PARA {Canal} ---", canal);
            
            try 
            {
                var rawLogs = await context.AiActionLogs
                    .AsNoTracking()
                    .Where(l => l.Canal == canal)
                    .OrderByDescending(l => l.Fecha)
                    .Take(400)
                    .ToListAsync();

                var contactoIds = rawLogs.Where(l => l.ContactoId.HasValue).Select(l => l.ContactoId!.Value).Distinct().ToList();
                var telefonos = rawLogs.Where(l => !string.IsNullOrWhiteSpace(l.TelefonoContacto)).Select(l => l.TelefonoContacto).Distinct().ToList();

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

                var response = rawLogs
                    .GroupBy(l => new { 
                        ContactoId = l.ContactoId, 
                        TelefonoContacto = l.ContactoId.HasValue ? null : l.TelefonoContacto,
                        OrphanId = (!l.ContactoId.HasValue && string.IsNullOrWhiteSpace(l.TelefonoContacto)) ? (Guid?)l.Id : null
                    })
                    .Select(g => {
                        var firstLog = g.First();
                        var cid = firstLog.ContactoId;
                        var phone = firstLog.TelefonoContacto;
                        
                        var contact = cid.HasValue && contactsById.ContainsKey(cid.Value) 
                            ? contactsById[cid.Value] 
                            : (!string.IsNullOrWhiteSpace(phone) && contactsByPhone.ContainsKey(phone!) ? contactsByPhone[phone!] : null);

                        bool registradoPorIA = contact != null && (contact.Origen == "IA WhatsApp" || 
                                               contact.Origen == "Aut. WhatsApp" || 
                                               contact.Origen == "Aut. Facebook");

                        var ultimaActividad = firstLog.Fecha;
                        
                        var logs = g.Select(l => new LogResponse(l.Id, l.Accion, l.DetalleJson, l.TriggerMessage, l.Fecha)).ToList();
                        
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
