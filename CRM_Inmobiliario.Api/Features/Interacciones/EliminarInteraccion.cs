using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Interacciones;

public static class EliminarInteraccionFeature
{
    public static void MapEliminarInteraccionEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapDelete("/api/interacciones/{id:guid}", async (Guid id, CrmDbContext context) =>
        {
            var rowsAffected = await context.Interactions
                .Where(i => i.Id == id)
                .ExecuteDeleteAsync();

            if (rowsAffected == 0) return Results.NotFound("Interacción no encontrada.");

            return Results.NoContent();
        })
        .WithTags("Interacciones")
        .WithName("EliminarInteraccion");
    }
}
