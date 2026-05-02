using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Contactos;

public static class EliminarContacto
{
    public static void MapEliminarContactoEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapDelete("/contactos/{id:guid}", async (Guid id, CrmDbContext context) =>
        {
            var affectedRows = await context.Contactos
                .Where(l => l.Id == id)
                .ExecuteDeleteAsync();

            if (affectedRows == 0)
            {
                return Results.NotFound(new { Message = "Contacto no encontrado." });
            }

            return Results.NoContent();
        })
        .RequireAuthorization()
        .WithName("EliminarContacto")
        .WithTags("Contactos");
    }
}
