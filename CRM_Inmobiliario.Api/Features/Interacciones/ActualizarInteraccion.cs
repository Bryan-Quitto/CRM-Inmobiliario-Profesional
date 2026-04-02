using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Interacciones;

public static class ActualizarInteraccionFeature
{
    public record Request(string Notas, string TipoInteraccion);

    public static void MapActualizarInteraccionEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPut("/interacciones/{id:guid}", async (Guid id, Request request, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            var rowsAffected = await context.Interactions
                .Where(i => i.Id == id && i.AgenteId == agenteId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(p => p.Notas, request.Notas)
                    .SetProperty(p => p.TipoInteraccion, request.TipoInteraccion));

            if (rowsAffected == 0) return Results.NotFound("Interacción no encontrada o no te pertenece.");

            return Results.NoContent();
        })
        .WithTags("Interacciones")
        .WithName("ActualizarInteraccion");
    }
}
