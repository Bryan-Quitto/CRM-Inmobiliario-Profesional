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
    public record Request(Guid PropiedadId, string Nombre, string Descripcion, int Orden);

    public static RouteHandlerBuilder MapRegistrarSeccionEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapPost("/propiedades/secciones", async (Request request, CrmDbContext context, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var currentUserId = user.GetRequiredUserId();
            var propiedad = await context.Properties
                .AsNoTracking()
                .Include(p => p.Agente)
                .Include(p => p.Transactions)
                .FirstOrDefaultAsync(p => p.Id == request.PropiedadId, ct);

            if (propiedad == null) return Results.NotFound("Propiedad no encontrada");

            if (!PropertyPermissionsHelper.CanManage(propiedad, currentUserId))
            {
                return Results.Forbid();
            }

            var strategy = context.Database.CreateExecutionStrategy();
            var nuevaSeccion = await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await context.Database.BeginTransactionAsync(ct);
                
                // Bloqueo pesimista para encolar la creación de secciones y subida de imágenes
                await context.Database.ExecuteSqlRawAsync("SELECT 1 FROM \"Properties\" WHERE \"Id\" = {0} FOR UPDATE", request.PropiedadId);

                // Recargar propiedad fresca bajo el bloqueo para evitar DbUpdateConcurrencyException
                var trackedProp = await context.Properties.FirstOrDefaultAsync(p => p.Id == request.PropiedadId, ct);

                var section = new PropertyGallerySection
                {
                    Id = Guid.NewGuid(),
                    PropiedadId = request.PropiedadId,
                    Nombre = request.Nombre,
                    Descripcion = request.Descripcion,
                    Orden = request.Orden
                };

                context.PropertyGallerySections.Add(section);
                await context.SaveChangesAsync(ct);

                await context.UpsertAgentPropertyActivityAsync(currentUserId, request.PropiedadId, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), ct);

                await transaction.CommitAsync(ct);
                return section;
            });

            return Results.Created($"/propiedades/secciones/{nuevaSeccion.Id}", nuevaSeccion);
        })
        .WithTags("Propiedades - Galería")
        .WithName("RegistrarSeccionGaleria")
        .RequireAuthorization();
    }
}
