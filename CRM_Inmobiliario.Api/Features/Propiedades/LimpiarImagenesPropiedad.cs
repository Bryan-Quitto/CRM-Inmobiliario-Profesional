using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class LimpiarImagenesPropiedadFeature
{
    public static void MapLimpiarImagenesPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapDelete("/propiedades/{propiedadId}/imagenes/limpiar", async (
            [FromRoute] Guid propiedadId,
            ClaimsPrincipal user,
            CrmDbContext context,
            CRM_Inmobiliario.Api.Infrastructure.Services.IR2StorageService r2Storage,
            CancellationToken ct,
            ILoggerFactory loggerFactory) =>
        {
            var logger = loggerFactory.CreateLogger("LimpiarImagenesPropiedad");
            var agenteId = user.GetRequiredUserId();
            
            try
            {
                var currentUserAgenciaId = await context.Agents
                    .AsNoTracking()
                    .Where(a => a.Id == agenteId)
                    .Select(a => a.AgenciaId)
                    .FirstOrDefaultAsync(ct);

                var exists = await context.Properties
                    .AnyAsync(p => p.Id == propiedadId && 
                                  (p.AgenteId == agenteId || p.CreatedByAgenteId == agenteId || (currentUserAgenciaId != null && p.AgenciaId == currentUserAgenciaId)), ct);

                if (!exists)
                    return Results.NotFound("Propiedad no encontrada.");

                // 1. Obtener rutas de archivos de imágenes que NO son principales
                var storagePaths = await context.PropertyMedia
                    .Where(m => m.PropiedadId == propiedadId && !m.EsPrincipal && !string.IsNullOrEmpty(m.StoragePath))
                    .Select(m => m.StoragePath!)
                    .ToListAsync(ct);

                // 2. Eliminar físicos de R2
                if (storagePaths.Any())
                {
                    var keys = storagePaths.Select(path => $"propiedades/{propiedadId}/{path}").ToList();
                    await r2Storage.DeleteManyAsync(keys);
                }

                // 3. Borrar las imágenes de la base de datos (excepto principal)
                await context.PropertyMedia
                    .Where(m => m.PropiedadId == propiedadId && !m.EsPrincipal)
                    .ExecuteDeleteAsync(ct);

                // 4. Borrar todas las secciones dinámicas (ya que sus fotos fueron borradas arriba o eran principales)
                // Nota: Las fotos principales que estaban en una sección ahora quedarán con SectionId = NULL
                // gracias a la configuración ON DELETE SET NULL del FK.
                await context.PropertyGallerySections
                    .Where(s => s.PropiedadId == propiedadId)
                    .ExecuteDeleteAsync(ct);

                await context.UpsertAgentPropertyActivityAsync(agenteId, propiedadId, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), ct);

                return Results.NoContent();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error al limpiar galería por cambio de estado");
                return Results.Problem(ex.Message);
            }
        })
        .WithTags("Propiedades")
        .WithName("LimpiarImagenesPropiedad");
    }
}

