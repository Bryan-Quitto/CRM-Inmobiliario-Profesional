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
        return app.MapDelete("/propiedades/secciones/{id}", async (Guid id, CrmDbContext context, Supabase.Client supabase) =>
        {
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
                // Gracias al DeleteBehavior.Cascade configurado en el DbContext, 
                // esto borrará automáticamente los registros de PropertyMedia asociados.
                var rowsAffected = await context.PropertyGallerySections
                    .Where(s => s.Id == id)
                    .ExecuteDeleteAsync();

                return rowsAffected > 0 ? Results.NoContent() : Results.NotFound();
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
