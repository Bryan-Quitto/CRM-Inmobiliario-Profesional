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

    public record ClientGroupResponse(
        string Telefono,
        string Nombre,
        Guid? ClienteId,
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

                var telefonos = rawLogs.Select(l => l.TelefonoCliente).Distinct().ToList();
                var clienteIds = rawLogs.Where(l => l.ClienteId.HasValue).Select(l => l.ClienteId!.Value).Distinct().ToList();

                var leads = await context.Leads
                    .AsNoTracking()
                    .Where(l => telefonos.Contains(l.Telefono) || clienteIds.Contains(l.Id))
                    .Include(l => l.PropertyInterests)
                        .ThenInclude(i => i.Propiedad)
                            .ThenInclude(p => p!.Media)
                    .ToListAsync();

                var response = new List<ClientGroupResponse>();

                foreach (var tel in telefonos)
                {
                    // Priorizar búsqueda por ClienteId, luego por teléfono
                    var clientLogs = rawLogs.Where(l => l.TelefonoCliente == tel).ToList();
                    var specificClientId = clientLogs.FirstOrDefault(l => l.ClienteId.HasValue)?.ClienteId;
                    
                    var lead = specificClientId.HasValue 
                        ? leads.FirstOrDefault(l => l.Id == specificClientId)
                        : leads.FirstOrDefault(l => l.Telefono == tel);
                    
                    bool registradoPorIA = clientLogs.Any(l => l.Accion == "Registro Lead" || l.Accion == "Registro de Prospecto");

                    var intereses = lead?.PropertyInterests
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

                    response.Add(new ClientGroupResponse(
                        tel,
                        lead != null ? $"{lead.Nombre} {lead.Apellido}".Trim() : "Cliente no identificado",
                        lead?.Id,
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
