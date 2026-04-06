using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Infrastructure.BackgroundServices;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.SeccionesGaleria;

public static class ActualizarSeccionFeature
{
    public record Request(string Nombre, string? Descripcion, int Orden);

    public static RouteHandlerBuilder MapActualizarSeccionEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapPut("/propiedades/secciones/{id}", async (Guid id, Request request, CrmDbContext context, IPdfGeneratorQueue pdfQueue) =>
        {
            var seccion = await context.PropertyGallerySections.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id);
            if (seccion == null) return Results.NotFound();

            var rowsAffected = await context.PropertyGallerySections
                .Where(s => s.Id == id)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(s => s.Nombre, request.Nombre)
                    .SetProperty(s => s.Descripcion, request.Descripcion)
                    .SetProperty(s => s.Orden, request.Orden));

            if (rowsAffected > 0)
            {
                await pdfQueue.QueuePdfGenerationAsync(seccion.PropiedadId);
                return Results.NoContent();
            }

            return Results.NotFound();
        })
        .WithTags("Propiedades - Galería")
        .WithName("ActualizarSeccionGaleria");
    }
}
