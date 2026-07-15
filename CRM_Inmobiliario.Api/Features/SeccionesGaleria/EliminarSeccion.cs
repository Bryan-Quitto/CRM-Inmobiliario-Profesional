using System;
using System.Linq;
using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Features.Propiedades;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.SeccionesGaleria;

public static class EliminarSeccionFeature
{
    public static RouteHandlerBuilder MapEliminarSeccionEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapDelete("/propiedades/secciones/{id}", async (Guid id, [FromQuery] bool deleteMedia, CrmDbContext context, CRM_Inmobiliario.Api.Infrastructure.Services.IR2StorageService r2Storage, ClaimsPrincipal user, CancellationToken ct) =>
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

            try 
            {
                if (deleteMedia)
                {
                    // 1. Obtener las rutas de almacenamiento de las imágenes de la sección que NO son principales
                    var storagePaths = await context.PropertyMedia
                        .Where(m => m.SectionId == id && !m.EsPrincipal && !string.IsNullOrEmpty(m.StoragePath))
                        .Select(m => m.StoragePath!)
                        .ToListAsync(ct);

                    // 2. Eliminar archivos físicos de R2
                    if (storagePaths.Any())
                    {
                        var keys = storagePaths.Select(path => $"propiedades/{seccion.PropiedadId}/{path}").ToList();
                        await r2Storage.DeleteManyWithQuotaLiberationAsync(keys, currentUserId);
                    }

                    // 3. Borrar de la base de datos las imágenes que no son principales
                    await context.PropertyMedia
                        .Where(m => m.SectionId == id && !m.EsPrincipal)
                        .ExecuteDeleteAsync(ct);

                    // 4. Desvincular la imagen principal (si la hubiera) para que no se borre en cascada
                    await context.PropertyMedia
                        .Where(m => m.SectionId == id && m.EsPrincipal)
                        .ExecuteUpdateAsync(s => s.SetProperty(m => m.SectionId, (Guid?)null), ct);
                }
                else
                {
                    // 1. Desvincular TODAS las imágenes de la sección para que pasen a la galería general (SectionId = null)
                    // Se hace esto ANTES de eliminar la sección para evitar el borrado en cascada configurado en EF Core.
                    await context.PropertyMedia
                        .Where(m => m.SectionId == id)
                        .ExecuteUpdateAsync(s => s.SetProperty(m => m.SectionId, (Guid?)null), ct);
                }

                // 2. Borrar la sección de la base de datos
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
                return Results.Problem($"Error al eliminar sección: {ex.Message}");
            }
        })
        .WithTags("Propiedades - Galería")
        .WithName("EliminarSeccionGaleria")
        .RequireAuthorization();
    }
}