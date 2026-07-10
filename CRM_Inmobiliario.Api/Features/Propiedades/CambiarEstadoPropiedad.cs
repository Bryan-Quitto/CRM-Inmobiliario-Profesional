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
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class CambiarEstadoPropiedadFeature
{
    public record Command(string NuevoEstado, decimal? PrecioCierre = null, decimal? MontoReserva = null, Guid? CerradoConId = null, string? Version = null, Guid? AgenteCerradorId = null);

    public static void MapCambiarEstadoPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPatch("/propiedades/{id:guid}/estado", async (
            Guid id, 
            Command command, 
            ClaimsPrincipal user, 
            CrmDbContext context,
            CRM_Inmobiliario.Api.Infrastructure.Services.IR2StorageService r2Storage,
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
                    command.MontoReserva,
                    command.CerradoConId, 
                    command.AgenteCerradorId,
                    currentUserId, 
                    context, 
                    logger, 
                    ct);

                // 3. CONFIGURACIÓN DE CONCURRENCIA (Spec 010)
                if (!string.IsNullOrEmpty(command.Version) && uint.TryParse(command.Version, out uint parsedVersion))
                {
                    context.Entry(validation.Property!).Property(p => p.Version).OriginalValue = parsedVersion;
                }

                // Limpieza de recursos si pasa a "Inactiva"
                if (command.NuevoEstado == "Inactiva")
                {
                    logger.LogInformation("🧹 [ESTADO] Propiedad {Id} marcada como Inactiva. Limpiando archivos físicos e imágenes...", id);
                    var storagePaths = await context.PropertyMedia
                        .Where(m => m.PropiedadId == id && !string.IsNullOrEmpty(m.StoragePath))
                        .Select(m => m.StoragePath!)
                        .ToListAsync(ct);

                    var keysToDelete = storagePaths.Select(path => $"propiedades/{id}/{path}").ToList();
                    keysToDelete.Add($"propiedades/{id}/ficha_{id}.pdf"); // Agregar PDF

                    try
                    {
                        if (keysToDelete.Any())
                        {
                            await r2Storage.DeleteManyAsync(keysToDelete);
                            logger.LogInformation("🧹 [ESTADO] {Count} archivos eliminados de R2 para la propiedad {Id}", keysToDelete.Count, id);
                        }
                    }
                    catch (Exception storageEx)
                    {
                        logger.LogWarning(storageEx, "⚠️ [ESTADO] Error al eliminar archivos de Storage (huérfanos potenciales) para {Id}.", id);
                    }

                    // Eliminar las imágenes de Supabase DB y Secciones
                    await context.PropertyMedia.Where(m => m.PropiedadId == id).ExecuteDeleteAsync(ct);
                    await context.PropertyGallerySections.Where(s => s.PropiedadId == id).ExecuteDeleteAsync(ct);
                }

                // 4. PERSISTENCIA Y EFECTOS SECUNDARIOS
                logger.LogInformation("💾 [ESTADO] Ejecutando SaveChangesAsync...");
                await context.SaveChangesAsync(CancellationToken.None);
                await context.UpsertAgentPropertyActivityAsync(currentUserId, id, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), CancellationToken.None);
                if (command.CerradoConId.HasValue)
                {
                    await context.UpsertAgentContactActivityAsync(currentUserId, command.CerradoConId.Value, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), CancellationToken.None);
                }
                
                // Notificaciones y Limpieza de Caché
                warmingService.NotifyChange(currentUserId);
                await InvalidateCachesAsync(cacheStore, ct);

                logger.LogInformation("🏁 [ESTADO] Proceso completado exitosamente para {Id}", id);
                return Results.NoContent();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                logger.LogWarning(ex, "⚠️ [ESTADO] Conflicto de concurrencia al actualizar la propiedad {Id}", id);
                return Results.Conflict(new { Message = "Los datos de la propiedad están desactualizados. Por favor, refresca la página para cargar la última versión." });
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
