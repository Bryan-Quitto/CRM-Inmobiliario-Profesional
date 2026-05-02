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
        app.MapGet("/ia/logs", async (CrmDbContext context, ILogger<CrmDbContext> logger) =>
        {
            logger.LogInformation("--- OBTENIENDO AUDITORÍA IA AGRUPADA ---");
            
            try 
            {
                var rawLogs = await context.AiActionLogs
                    .AsNoTracking()
                    .OrderByDescending(l => l.Fecha)
                    .Take(400)
                    .ToListAsync();

                var telefonos = rawLogs.Select(l => l.TelefonoContacto).Distinct().ToList();
                var contactoIds = rawLogs.Where(l => l.ContactoId.HasValue).Select(l => l.ContactoId!.Value).Distinct().ToList();

                var contactos = await context.Contactos
                    .AsNoTracking()
                    .Where(l => telefonos.Contains(l.Telefono) || contactoIds.Contains(l.Id))
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
                    
                    var contacto = specificContactId.HasValue 
                        ? contactos.FirstOrDefault(l => l.Id == specificContactId)
                        : contactos.FirstOrDefault(l => l.Telefono == tel);
                    
                    bool registradoPorIA = clientLogs.Any(l => l.Accion == "Registro Lead" || l.Accion == "Registro de Contacto" || l.Accion == "Registro de Prospecto");

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

                    response.Add(new ContactGroupResponse(
                        tel,
                        contacto != null ? $"{contacto.Nombre} {contacto.Apellido}".Trim() : "Contacto no identificado",
                        contacto?.Id,
                        clientLogs.First().Fecha,
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
