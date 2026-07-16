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
            [FromQuery] bool soloGeneral,
            ClaimsPrincipal user,
            CrmDbContext context,
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
                var query = context.PropertyMedia
                    .Where(m => m.PropiedadId == propiedadId && !m.EsPrincipal && !string.IsNullOrEmpty(m.StoragePath));
                
                if (soloGeneral)
                {
                    query = query.Where(m => m.SectionId == null);
                }

                var storagePaths = await query.Select(m => m.StoragePath!).ToListAsync(ct);

                // 2. Encolar borrado físico y liberar cuota (Outbox Pattern)
                if (storagePaths.Any())
                {
                    var keys = storagePaths.Select(path => $"propiedades/{propiedadId}/{path}").ToList();
                    await context.QueueStorageDeletionsWithQuotaLiberationAsync(keys, agenteId, ct);
                }

                // 3. Borrar las imágenes de la base de datos (excepto principal)
                var dbQuery = context.PropertyMedia
                    .Where(m => m.PropiedadId == propiedadId && !m.EsPrincipal);
                
                if (soloGeneral)
                {
                    dbQuery = dbQuery.Where(m => m.SectionId == null);
                }

                await dbQuery.ExecuteDeleteAsync(ct);

                // 4. Borrar todas las secciones dinámicas solo si no es soloGeneral
                if (!soloGeneral)
                {
                    await context.PropertyGallerySections
                        .Where(s => s.PropiedadId == propiedadId)
                        .ExecuteDeleteAsync(ct);
                }

                await context.Properties
                    .Where(p => p.Id == propiedadId)
                    .ExecuteUpdateAsync(s => s.SetProperty(p => p.FechaActualizacion, DateTimeOffset.UtcNow), ct);

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