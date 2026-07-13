using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Features.Propiedades;
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
        return app.MapPut("/propiedades/imagenes/{id}/descripcion", async (Guid id, Request request, CrmDbContext context, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var currentUserId = user.GetRequiredUserId();
            var propertyMedia = await context.PropertyMedia
                .Include(m => m.Propiedad)
                    .ThenInclude(p => p!.Agente)
                .Include(m => m.Propiedad)
                    .ThenInclude(p => p!.Transactions)
                .FirstOrDefaultAsync(m => m.Id == id, ct);

            if (propertyMedia == null) return Results.NotFound();

            if (!PropertyPermissionsHelper.CanManage(propertyMedia.Propiedad!, currentUserId))
            {
                return Results.Forbid();
            }

            var rowsAffected = await context.PropertyMedia
                .Where(m => m.Id == id)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(m => m.Descripcion, request.Descripcion), ct);

            await context.UpsertAgentPropertyActivityAsync(currentUserId, propertyMedia.PropiedadId, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), ct);

            if (rowsAffected > 0)
            {
                await context.Properties
                    .Where(p => p.Id == propertyMedia.PropiedadId)
                    .ExecuteUpdateAsync(s => s.SetProperty(p => p.FechaActualizacion, DateTimeOffset.UtcNow), ct);
                
                return Results.NoContent();
            }

            return Results.NotFound();
        })
        .WithTags("Propiedades - Galería")
        .WithName("ActualizarDescripcionMultimedia")
        .RequireAuthorization();
    }
}
