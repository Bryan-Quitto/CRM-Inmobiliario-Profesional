using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Infrastructure.BackgroundServices;
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
        return app.MapPut("/propiedades/imagenes/{id}/descripcion", async (Guid id, Request request, CrmDbContext context, IPdfGeneratorQueue pdfQueue) =>
        {
            var media = await context.PropertyMedia.AsNoTracking().FirstOrDefaultAsync(m => m.Id == id);
            if (media == null) return Results.NotFound();

            var rowsAffected = await context.PropertyMedia
                .Where(m => m.Id == id)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(m => m.Descripcion, request.Descripcion));

            if (rowsAffected > 0)
            {
                await pdfQueue.QueuePdfGenerationAsync(media.PropiedadId);
                return Results.NoContent();
            }

            return Results.NotFound();
        })
        .WithTags("Propiedades - Galería")
        .WithName("ActualizarDescripcionMultimedia");
    }
}
