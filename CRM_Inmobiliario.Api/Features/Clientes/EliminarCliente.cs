using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Clientes;

public static class EliminarCliente
{
    public static void MapEliminarCliente(this IEndpointRouteBuilder app)
    {
        app.MapDelete("/clientes/{id:guid}", async (Guid id, CrmDbContext context) =>
        {
            var affectedRows = await context.Leads
                .Where(l => l.Id == id)
                .ExecuteDeleteAsync();

            if (affectedRows == 0)
                return Results.NotFound(new { Message = "Cliente no encontrado." });

            return Results.NoContent();
        })
        .WithName("EliminarCliente")
        .WithTags("Clientes");
    }
}
