using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.WhatsApp;

public static class ObtenerLogsIa
{
    public record Response(
        Guid Id,
        string TelefonoCliente,
        string Accion,
        string? DetalleJson,
        DateTimeOffset Fecha);

    public static void MapObtenerLogsIa(this IEndpointRouteBuilder app)
    {
        // Ruta relativa al apiGroup (/api)
        app.MapGet("/ia/logs", async (CrmDbContext context, ILogger<CrmDbContext> logger) =>
        {
            logger.LogInformation("--- PETICIÓN RECIBIDA: GET /api/ia/logs ---");
            
            try 
            {
                var logs = await context.AiActionLogs
                    .AsNoTracking()
                    .OrderByDescending(l => l.Fecha)
                    .Take(100)
                    .Select(l => new Response(
                        l.Id,
                        l.TelefonoCliente,
                        l.Accion,
                        l.DetalleJson,
                        l.Fecha))
                    .ToListAsync();

                logger.LogInformation("--- LOGS RECUPERADOS: {Count} ---", logs.Count);
                return Results.Ok(logs);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "--- ERROR EN GET /api/ia/logs ---");
                return Results.Problem("Error interno al recuperar los logs.");
            }
        })
        .WithName("ObtenerLogsIa")
        .WithTags("IA");
    }
}
