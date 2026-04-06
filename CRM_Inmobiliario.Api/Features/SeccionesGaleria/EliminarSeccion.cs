using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Infrastructure.BackgroundServices;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.SeccionesGaleria;

public static class EliminarSeccionFeature
{
    public static RouteHandlerBuilder MapEliminarSeccionEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapDelete("/propiedades/secciones/{id}", async (Guid id, CrmDbContext context, Supabase.Client supabase, IPdfGeneratorQueue pdfQueue) =>
        {
            // 0. Obtener ID de propiedad antes de borrar
            var seccion = await context.PropertyGallerySections.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id);
            if (seccion == null) return Results.NotFound();

            // 1. Obtener las rutas de almacenamiento de las imágenes de la sección antes de borrarlas de la DB
            var storagePaths = await context.PropertyMedia
                .Where(m => m.SectionId == id && !string.IsNullOrEmpty(m.StoragePath))
                .Select(m => m.StoragePath!)
                .ToListAsync();

            try 
            {
                // 2. Eliminar archivos físicos de Supabase Storage
                if (storagePaths.Any())
                {
                    await supabase.Storage.From("propiedades").Remove(storagePaths);
                }

                // 3. Borrar la sección de la base de datos
                var rowsAffected = await context.PropertyGallerySections
                    .Where(s => s.Id == id)
                    .ExecuteDeleteAsync();

                if (rowsAffected > 0)
                {
                    await pdfQueue.QueuePdfGenerationAsync(seccion.PropiedadId);
                    return Results.NoContent();
                }

                return Results.NotFound();
            }
            catch (Exception ex)
            {
                // Logueamos el error y devolvemos problema
                Console.WriteLine($"ERROR [DeleteSection]: {ex.Message}");
                return Results.Problem($"Error al eliminar sección y archivos: {ex.Message}");
            }
        })
        .WithTags("Propiedades - Galería")
        .WithName("EliminarSeccionGaleria");
    }
}
