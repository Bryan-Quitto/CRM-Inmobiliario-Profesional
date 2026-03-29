using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class EliminarImagenesSeleccionadasFeature
{
    public static void MapEliminarImagenesSeleccionadasEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapDelete("/api/propiedades/{propiedadId}/imagenes/seleccion", async (
            [FromRoute] Guid propiedadId,
            [FromBody] List<Guid> ids,
            CrmDbContext context,
            Supabase.Client supabase,
            CancellationToken ct,
            ILoggerFactory loggerFactory) =>
        {
            var logger = loggerFactory.CreateLogger("EliminarImagenesSeleccionadas");
            
            if (ids == null || ids.Count == 0)
                return Results.BadRequest("Debe proporcionar al menos un ID de imagen.");

            logger.LogInformation("Iniciando eliminación de {Count} imágenes seleccionadas para la propiedad {PropiedadId}", ids.Count, propiedadId);

            try
            {
                // 1. Obtener las rutas de almacenamiento de las imágenes seleccionadas
                var storagePaths = await context.PropertyMedia
                    .Where(m => m.PropiedadId == propiedadId && ids.Contains(m.Id) && !string.IsNullOrEmpty(m.StoragePath))
                    .Select(m => m.StoragePath!)
                    .ToListAsync(ct);

                if (storagePaths.Count == 0 && ids.Count > 0)
                {
                    logger.LogWarning("No se encontraron rutas de almacenamiento para los IDs proporcionados.");
                }

                // 2. Ejecutar borrado masivo en la base de datos
                var deletedRows = await context.PropertyMedia
                    .Where(m => m.PropiedadId == propiedadId && ids.Contains(m.Id))
                    .ExecuteDeleteAsync(ct);

                logger.LogInformation("Se eliminaron {Count} registros de la base de datos", deletedRows);

                if (deletedRows == 0)
                    return Results.NotFound("No se encontraron las imágenes especificadas.");

                // 3. Limpiar los archivos físicos de Supabase Storage
                if (storagePaths.Count > 0)
                {
                    var bucket = supabase.Storage.From("propiedades");
                    try 
                    {
                        await bucket.Remove(storagePaths);
                        logger.LogInformation("Archivos físicos eliminados correctamente");
                    }
                    catch (Exception storageEx)
                    {
                        logger.LogWarning(storageEx, "Error al eliminar algunos archivos de Storage (huérfanos potenciales).");
                    }
                }

                return Results.NoContent();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error al eliminar imágenes seleccionadas");
                return Results.Problem($"Error al eliminar imágenes seleccionadas: {ex.Message}");
            }
        })
        .WithTags("Propiedades")
        .WithName("EliminarImagenesSeleccionadas");
    }
}
