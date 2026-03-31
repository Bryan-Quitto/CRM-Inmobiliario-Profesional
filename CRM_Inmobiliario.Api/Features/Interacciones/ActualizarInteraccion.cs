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
        app.MapPut("/api/interacciones/{id:guid}", async (Guid id, Request request, CrmDbContext context) =>
        {
            var rowsAffected = await context.Interactions
                .Where(i => i.Id == id)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(p => p.Notas, request.Notas)
                    .SetProperty(p => p.TipoInteraccion, request.TipoInteraccion));

            if (rowsAffected == 0) return Results.NotFound("Interacción no encontrada.");

            return Results.NoContent();
        })
        .WithTags("Interacciones")
        .WithName("ActualizarInteraccion");
    }
}
