using CRM_Inmobiliario.Api.Infrastructure.Persistence;
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
        return app.MapPut("/propiedades/secciones/{id}", async (Guid id, Request request, CrmDbContext context) =>
        {
            var rowsAffected = await context.PropertyGallerySections
                .Where(s => s.Id == id)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(s => s.Nombre, request.Nombre)
                    .SetProperty(s => s.Descripcion, request.Descripcion)
                    .SetProperty(s => s.Orden, request.Orden));

            if (rowsAffected > 0)
            {
                return Results.NoContent();
            }

            return Results.NotFound();
        })
        .WithTags("Propiedades - Galería")
        .WithName("ActualizarSeccionGaleria");
    }
}
