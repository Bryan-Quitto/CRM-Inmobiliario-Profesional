using System;
using System.Security.Claims;
using System.Threading;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Features.Dashboard;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.OutputCaching;
using System.Threading.Tasks;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class CambiarEstadoPropiedadFeature
{
    public record Command(string NuevoEstado, decimal? PrecioCierre = null, Guid? CerradoConId = null);

    public static void MapCambiarEstadoPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPatch("/propiedades/{id:guid}/estado", async (
            Guid id, 
            Command command, 
            ClaimsPrincipal user, 
            CrmDbContext context,
            ILoggerFactory loggerFactory,
            IOutputCacheStore cacheStore,
            IKpiWarmingService warmingService,
            CancellationToken ct) =>
        {
            var logger = loggerFactory.CreateLogger("CambiarEstadoPropiedad");
            var currentUserId = user.GetRequiredUserId();

            try
            {
                // 1. VALIDACIÓN Y SEGURIDAD (Extraído)
                var validation = await CambiarEstadoValidator.ValidateAsync(
                    id, currentUserId, command.NuevoEstado, context, logger, ct);

                if (!validation.Success)
                {
                    return validation.StatusCode switch
                    {
                        StatusCodes.Status404NotFound => Results.NotFound(new { Message = validation.Message }),
                        _ => Results.Json(new { Message = validation.Message }, statusCode: validation.StatusCode)
                    };
                }

                // 2. PROCESAMIENTO DE NEGOCIO (Extraído - Spec 011 & Cycle Management)
                await CambiarEstadoProcessor.ProcessAsync(
                    validation.Property!, 
                    command.NuevoEstado, 
                    command.PrecioCierre, 
                    command.CerradoConId, 
                    currentUserId, 
                    context, 
                    logger, 
                    ct);

                // 3. PERSISTENCIA Y EFECTOS SECUNDARIOS
                logger.LogInformation("💾 [ESTADO] Ejecutando SaveChangesAsync...");
                await context.SaveChangesAsync(CancellationToken.None);
                
                // Notificaciones y Limpieza de Caché
                warmingService.NotifyChange(currentUserId);
                await InvalidateCachesAsync(cacheStore, ct);

                logger.LogInformation("🏁 [ESTADO] Proceso completado exitosamente para {Id}", id);
                return Results.NoContent();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "❌ [ESTADO] ERROR crítico al procesar el cambio de estado para la propiedad {Id}", id);
                return Results.Problem($"Error al procesar el cambio de estado: {ex.Message}");
            }
        })
        .WithTags("Propiedades")
        .WithName("CambiarEstadoPropiedad");
    }

    private static async Task InvalidateCachesAsync(IOutputCacheStore cacheStore, CancellationToken ct)
    {
        await cacheStore.EvictByTagAsync("dashboard-data", ct);
        await cacheStore.EvictByTagAsync("analytics-data", ct);
        await cacheStore.EvictByTagAsync("properties-data", ct);
    }
}
