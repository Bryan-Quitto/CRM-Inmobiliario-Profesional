using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.SeccionesGaleria;

public static class ActualizarDescripcionMultimediaFeature
{
    public record Request(string? Descripcion);

    public static RouteHandlerBuilder MapActualizarDescripcionMultimediaEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapPut("/propiedades/imagenes/{id}/descripcion", async (Guid id, Request request, CrmDbContext context) =>
        {
            var rowsAffected = await context.PropertyMedia
                .Where(m => m.Id == id)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(m => m.Descripcion, request.Descripcion));

            if (rowsAffected > 0)
            {
                return Results.NoContent();
            }

            return Results.NotFound();
        })
        .WithTags("Propiedades - Galería")
        .WithName("ActualizarDescripcionMultimedia");
    }
}
