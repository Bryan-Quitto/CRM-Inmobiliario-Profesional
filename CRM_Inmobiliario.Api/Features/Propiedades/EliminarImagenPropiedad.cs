using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class EliminarImagenPropiedadFeature
{
    public static void MapEliminarImagenPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapDelete("/api/propiedades/{propiedadId}/imagenes/{imagenId}", async (
            [FromRoute] Guid propiedadId,
            [FromRoute] Guid imagenId,
            CrmDbContext context,
            Supabase.Client supabase) =>
        {
            // 1. Buscar el registro de la imagen en la base de datos
            var media = await context.PropertyMedia
                .FirstOrDefaultAsync(m => m.Id == imagenId && m.PropiedadId == propiedadId);

            if (media == null)
                return Results.NotFound("La imagen no existe o no pertenece a esta propiedad.");

            try
            {
                // 2. Eliminar el archivo físico de Supabase Storage
                if (!string.IsNullOrEmpty(media.StoragePath))
                {
                    var bucket = supabase.Storage.From("propiedades");

                    try 
                    {
                        // Con la Service Role Key, esto debería tener permiso total
                        await bucket.Remove(media.StoragePath);
                    }
                    catch (Exception storageEx)
                    {
                        // Si falla aquí con la Service Role Key, es probable que sea un error de red o de Supabase
                        return Results.Problem($"Error crítico de Supabase Storage: {storageEx.Message}. Verifique la conexión con el servidor.");
                    }
                }

                // 3. Eliminar el registro de la base de datos (Hard Delete)
                context.PropertyMedia.Remove(media);
                await context.SaveChangesAsync();

                return Results.NoContent();
            }
            catch (Exception ex)
            {
                return Results.Problem($"Error al eliminar la imagen: {ex.Message}");
            }
        })
        .WithTags("Propiedades")
        .WithName("EliminarImagenPropiedad");
    }
}
