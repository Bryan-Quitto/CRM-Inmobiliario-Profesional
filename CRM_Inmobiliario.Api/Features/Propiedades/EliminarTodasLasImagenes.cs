using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class EliminarTodasLasImagenesFeature
{
    public static void MapEliminarTodasLasImagenesEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapDelete("/api/propiedades/{propiedadId}/imagenes", async (
            [FromRoute] Guid propiedadId,
            CrmDbContext context,
            Supabase.Client supabase,
            CancellationToken ct,
            ILoggerFactory loggerFactory) =>
        {
            var logger = loggerFactory.CreateLogger("EliminarTodasLasImagenes");
            logger.LogInformation("Iniciando eliminación de todas las imágenes para la propiedad {PropiedadId}", propiedadId);

            try
            {
                // 1. Obtener primero las rutas de almacenamiento para poder borrar del Storage después
                var storagePaths = await context.PropertyMedia
                    .Where(m => m.PropiedadId == propiedadId && !string.IsNullOrEmpty(m.StoragePath))
                    .Select(m => m.StoragePath!)
                    .ToListAsync(ct);

                logger.LogInformation("Se encontraron {Count} rutas de archivos en Storage para eliminar", storagePaths.Count);

                // 2. Ejecutar borrado masivo en la base de datos usando ExecuteDeleteAsync (EF Core 7+)
                // Esto es mucho más eficiente y evita el ObjectDisposedException del ChangeTracker
                logger.LogInformation("Ejecutando borrado masivo en la base de datos para la propiedad {PropiedadId}", propiedadId);
                var deletedRows = await context.PropertyMedia
                    .Where(m => m.PropiedadId == propiedadId)
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
                        // incluso si el cliente cancela la petición HTTP justo después del borrado en DB
                        await bucket.Remove(storagePaths);
                        logger.LogInformation("Archivos físicos eliminados correctamente del bucket");
                    }
                    catch (Exception storageEx)
                    {
                        // Logueamos pero no fallamos la petición porque la DB ya está limpia
                        logger.LogWarning(storageEx, "Error al eliminar archivos de Storage (huérfanos potenciales).");
                    }
                }

                logger.LogInformation("Eliminación masiva completada con éxito");
                return Results.NoContent();
            }
            catch (OperationCanceledException)
            {
                logger.LogWarning("La operación de eliminación fue cancelada");
                return Results.StatusCode(499); // Client Closed Request
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error fatal al eliminar todas las imágenes de la propiedad {PropiedadId}", propiedadId);
                return Results.Problem($"Error al eliminar todas las imágenes: {ex.Message}");
            }
        })
        .WithTags("Propiedades")
        .WithName("EliminarTodasLasImagenes");
    }
}
