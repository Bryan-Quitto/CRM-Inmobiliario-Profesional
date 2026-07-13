using System;
using System.Linq;
using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Features.Propiedades;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.SeccionesGaleria;

public static class EliminarSeccionFeature
{
    public static RouteHandlerBuilder MapEliminarSeccionEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapDelete("/propiedades/secciones/{id}", async (Guid id, CrmDbContext context, CRM_Inmobiliario.Api.Infrastructure.Services.IR2StorageService r2Storage, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var currentUserId = user.GetRequiredUserId();

            // 0. Obtener ID de propiedad antes de borrar
            var seccion = await context.PropertyGallerySections
                .Include(s => s.Propiedad)
                    .ThenInclude(p => p!.Agente)
                .Include(s => s.Propiedad)
                    .ThenInclude(p => p!.Transactions)
                .FirstOrDefaultAsync(s => s.Id == id, ct);

            if (seccion == null) return Results.NotFound();

            if (!PropertyPermissionsHelper.CanManage(seccion.Propiedad!, currentUserId))
            {
                return Results.Forbid();
            }

            // 1. Obtener las rutas de almacenamiento de las imágenes de la sección antes de borrarlas de la DB
            var storagePaths = await context.PropertyMedia
                .Where(m => m.SectionId == id && !string.IsNullOrEmpty(m.StoragePath))
                .Select(m => m.StoragePath!)
                .ToListAsync(ct);

            try 
            {
                // 2. Eliminar archivos físicos de R2
                if (storagePaths.Any())
                {
                    var keys = storagePaths.Select(path => $"propiedades/{seccion.PropiedadId}/{path}").ToList();
                    await r2Storage.DeleteManyAsync(keys);
                }

                // 3. Borrar la sección de la base de datos
                var rowsAffected = await context.PropertyGallerySections
                    .Where(s => s.Id == id)
                    .ExecuteDeleteAsync(ct);

                await context.UpsertAgentPropertyActivityAsync(currentUserId, seccion.PropiedadId, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), ct);

                if (rowsAffected > 0)
                {
                    await context.Properties
                        .Where(p => p.Id == seccion.PropiedadId)
                        .ExecuteUpdateAsync(s => s.SetProperty(p => p.FechaActualizacion, DateTimeOffset.UtcNow), ct);
                        
                    return Results.NoContent();
                }

                return Results.NotFound();
            }
            catch (Exception ex)
            {
                // Logueamos el error y devolvemos problema
                return Results.Problem($"Error al eliminar sección y archivos: {ex.Message}");
            }
        })
        .WithTags("Propiedades - Galería")
        .WithName("EliminarSeccionGaleria")
        .RequireAuthorization();
    }
}
