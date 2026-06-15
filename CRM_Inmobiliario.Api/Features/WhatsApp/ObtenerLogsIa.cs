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
        app.MapGet("/ia/logs", async ([Microsoft.AspNetCore.Mvc.FromQuery] string canal, CrmDbContext context, ILogger<CrmDbContext> logger) =>
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

                var telefonos = rawLogs.Select(l => l.TelefonoContacto).ToList();
                var contactoIds = rawLogs.Where(l => l.ContactoId.HasValue).Select(l => l.ContactoId!.Value).ToList();

                var recentWhatsAppMessages = new List<CRM_Inmobiliario.Api.Domain.Entities.WhatsappMessage>();
                if (canal == "WhatsApp")
                {
                    recentWhatsAppMessages = await context.WhatsappMessages
                        .AsNoTracking()
                        .OrderByDescending(m => m.Fecha)
                        .Take(400)
                        .ToListAsync();
                        
                    telefonos.AddRange(recentWhatsAppMessages.Select(m => m.Telefono));
                    contactoIds.AddRange(recentWhatsAppMessages.Where(m => m.ContactoId.HasValue).Select(m => m.ContactoId!.Value));
                }

                telefonos = telefonos.Distinct().ToList();
                contactoIds = contactoIds.Distinct().ToList();

                var contactos = await context.Contactos
                    .AsNoTracking()
                    .Where(l => (l.Telefono != null && telefonos.Contains(l.Telefono)) || 
                                (l.FacebookSenderId != null && telefonos.Contains(l.FacebookSenderId)) || 
                                contactoIds.Contains(l.Id))
                    .Include(l => l.PropertyInterests)
                        .ThenInclude(i => i.Propiedad)
                            .ThenInclude(p => p!.Media)
                    .ToListAsync();

                var response = new List<ContactGroupResponse>();

                foreach (var tel in telefonos)
                {
                    // Priorizar búsqueda por ContactoId, luego por teléfono
                    var clientLogs = rawLogs.Where(l => l.TelefonoContacto == tel).ToList();
                    var specificContactId = clientLogs.FirstOrDefault(l => l.ContactoId.HasValue)?.ContactoId;
                    
                    var contacto = contactos.FirstOrDefault(l => l.Id == specificContactId);

                    if (contacto == null)
                    {
                        contacto = canal == "Facebook" 
                            ? contactos.FirstOrDefault(l => l.FacebookSenderId == tel) 
                            : contactos.FirstOrDefault(l => l.Telefono == tel);
                    }
                    
                    bool registradoPorIA = contacto != null && 
                        (contacto.Origen == "IA WhatsApp" || 
                         contacto.Origen == "Aut. WhatsApp" || 
                         contacto.Origen == "Aut. Facebook");

                    var intereses = contacto?.PropertyInterests
                        .Where(i => i.Propiedad != null)
                        .Select(i => new InteresResumen(
                        i.PropiedadId,
                        i.Propiedad?.Titulo ?? "Sin Título",
                        i.Propiedad?.Media?.OrderBy(m => m.Orden).FirstOrDefault()?.StoragePath,
                        i.Propiedad?.Precio ?? 0,
                        i.Propiedad?.Sector,
                        i.NivelInteres,
                        i.FechaRegistro
                    )).OrderByDescending(i => i.Fecha).ToList() ?? new List<InteresResumen>();

                    var ultimaActividad = clientLogs.Any() ? clientLogs.First().Fecha : DateTimeOffset.MinValue;
                    if (canal == "WhatsApp")
                    {
                        var lastMsg = recentWhatsAppMessages.FirstOrDefault(m => m.Telefono == tel);
                        if (lastMsg != null && lastMsg.Fecha > ultimaActividad)
                        {
                            ultimaActividad = lastMsg.Fecha;
                        }
                    }

                    if (ultimaActividad == DateTimeOffset.MinValue && contacto != null)
                    {
                        ultimaActividad = contacto.FechaCreacion;
                    }

                    response.Add(new ContactGroupResponse(
                        tel,
                        contacto != null ? $"{contacto.Nombre} {contacto.Apellido}".Trim() : "Contacto no identificado",
                        contacto?.Id,
                        ultimaActividad,
                        registradoPorIA,
                        clientLogs.Select(l => new LogResponse(l.Id, l.Accion, l.DetalleJson, l.TriggerMessage, l.Fecha)).ToList(),
                        intereses
                    ));
                }

                return Results.Ok(response);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error al recuperar logs agrupados");
                return Results.Problem("Error interno.");
            }
        })
        .WithName("ObtenerLogsIa")
        .WithTags("IA");
    }
}
