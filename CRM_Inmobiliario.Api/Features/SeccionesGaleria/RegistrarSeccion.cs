using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Features.Propiedades;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
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
        return app.MapPost("/propiedades/secciones", async (Request request, CrmDbContext context, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var currentUserId = user.GetRequiredUserId();
            var propiedad = await context.Properties
                .Include(p => p.Agente)
                .Include(p => p.Transactions)
                .FirstOrDefaultAsync(p => p.Id == request.PropiedadId, ct);

            if (propiedad == null) return Results.NotFound("Propiedad no encontrada");

            if (!PropertyPermissionsHelper.CanManage(propiedad, currentUserId))
            {
                return Results.Forbid();
            }

            var nuevaSeccion = new PropertyGallerySection
            {
                Id = Guid.NewGuid(),
                PropiedadId = request.PropiedadId,
                Nombre = request.Nombre,
                Orden = request.Orden
            };

            context.PropertyGallerySections.Add(nuevaSeccion);
            await context.SaveChangesAsync(ct);

            await context.UpsertAgentPropertyActivityAsync(currentUserId, propiedad.Id, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), ct);

            return Results.Created($"/propiedades/secciones/{nuevaSeccion.Id}", nuevaSeccion);
        })
        .WithTags("Propiedades - Galería")
        .WithName("RegistrarSeccionGaleria")
        .RequireAuthorization();
    }
}
