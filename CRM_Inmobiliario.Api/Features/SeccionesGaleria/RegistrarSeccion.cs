using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Infrastructure.BackgroundServices;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.SeccionesGaleria;

public static class RegistrarSeccionFeature
{
    public record Request(Guid PropiedadId, string Nombre, int Orden);

    public static RouteHandlerBuilder MapRegistrarSeccionEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapPost("/propiedades/secciones", async (Request request, CrmDbContext context, IPdfGeneratorQueue pdfQueue) =>
        {
            var propiedadExiste = await context.Properties.AnyAsync(p => p.Id == request.PropiedadId);
            if (!propiedadExiste) return Results.NotFound("Propiedad no encontrada");

            var nuevaSeccion = new PropertyGallerySection
            {
                Id = Guid.NewGuid(),
                PropiedadId = request.PropiedadId,
                Nombre = request.Nombre,
                Orden = request.Orden
            };

            context.PropertyGallerySections.Add(nuevaSeccion);
            await context.SaveChangesAsync();

            await pdfQueue.QueuePdfGenerationAsync(request.PropiedadId);

            return Results.Created($"/propiedades/secciones/{nuevaSeccion.Id}", nuevaSeccion);
        })
        .WithTags("Propiedades - Galería")
        .WithName("RegistrarSeccionGaleria");
    }
}
