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
        app.MapDelete("/api/propiedades/{propiedadId}/imagenes/limpiar", async (
            [FromRoute] Guid propiedadId,
            CrmDbContext context,
            Supabase.Client supabase,
            CancellationToken ct,
            ILoggerFactory loggerFactory) =>
        {
            var logger = loggerFactory.CreateLogger("LimpiarImagenesPropiedad");
            logger.LogInformation("Iniciando limpieza de imágenes no principales para la propiedad {PropiedadId}", propiedadId);

            try
            {
                // 1. Obtener las rutas de almacenamiento de las imágenes que NO son principales
                var storagePaths = await context.PropertyMedia
                    .Where(m => m.PropiedadId == propiedadId && !m.EsPrincipal && !string.IsNullOrEmpty(m.StoragePath))
                    .Select(m => m.StoragePath!)
                    .ToListAsync(ct);

                logger.LogInformation("Se encontraron {Count} rutas de archivos en Storage para eliminar (no principales)", storagePaths.Count);

                // 2. Ejecutar borrado masivo en la base de datos de las imágenes que NO son principales
                var deletedRows = await context.PropertyMedia
                    .Where(m => m.PropiedadId == propiedadId && !m.EsPrincipal)
                    .ExecuteDeleteAsync(ct);

                logger.LogInformation("Se eliminaron {Count} registros de la base de datos", deletedRows);

                if (deletedRows == 0)
                    return Results.NoContent();

                // 3. Limpiar los archivos físicos de Supabase Storage
                if (storagePaths.Count > 0)
                {
                    logger.LogInformation("Eliminando {Count} archivos físicos de Supabase Storage", storagePaths.Count);
                    var bucket = supabase.Storage.From("propiedades");
                    
                    try 
                    {
                        // No pasamos el CT aquí para asegurar que el borrado físico ocurra 
                        await bucket.Remove(storagePaths);
                        logger.LogInformation("Archivos físicos eliminados correctamente del bucket");
                    }
                    catch (Exception storageEx)
                    {
                        logger.LogWarning(storageEx, "Error al eliminar archivos de Storage (huérfanos potenciales).");
                    }
                }

                logger.LogInformation("Limpieza de imágenes completada con éxito");
                return Results.NoContent();
            }
            catch (OperationCanceledException)
            {
                logger.LogWarning("La operación de limpieza fue cancelada");
                return Results.StatusCode(499);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error fatal al limpiar las imágenes de la propiedad {PropiedadId}", propiedadId);
                return Results.Problem($"Error al limpiar las imágenes: {ex.Message}");
            }
        })
        .WithTags("Propiedades")
        .WithName("LimpiarImagenesPropiedad");
    }
}
