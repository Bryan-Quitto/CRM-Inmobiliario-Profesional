using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Features.Propiedades;
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
        return app.MapPut("/propiedades/secciones/{id}", async (Guid id, Request request, CrmDbContext context, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var currentUserId = user.GetRequiredUserId();
            
            var seccion = await context.PropertyGallerySections
                .Include(s => s.Propiedad)
                    .ThenInclude(p => p!.Agente)
                .Include(s => s.Propiedad)
                    .ThenInclude(p => p!.Transactions)
                .FirstOrDefaultAsync(s => s.Id == id, ct);

            if (seccion == null) return Results.NotFound();

            if (!PropertyPermissionsHelper.CanManage(seccion.Propiedad!, currentUserId))
            {
                return Results.Forbid();
            }

            var rowsAffected = await context.PropertyGallerySections
                .Where(s => s.Id == id)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(s => s.Nombre, request.Nombre)
                    .SetProperty(s => s.Descripcion, request.Descripcion)
                    .SetProperty(s => s.Orden, request.Orden), ct);

            await context.UpsertAgentPropertyActivityAsync(currentUserId, seccion.PropiedadId, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), ct);

            if (rowsAffected > 0)
            {
                return Results.NoContent();
            }

            return Results.NotFound();
        })
        .WithTags("Propiedades - Galería")
        .WithName("ActualizarSeccionGaleria")
        .RequireAuthorization();
    }
}
