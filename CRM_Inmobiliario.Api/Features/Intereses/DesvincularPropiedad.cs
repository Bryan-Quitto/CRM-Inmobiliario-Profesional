using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Intereses;

public static class DesvincularPropiedadFeature
{
    public static void MapDesvincularPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapDelete("/api/clientes/{clienteId:guid}/intereses/{propiedadId:guid}", async (Guid clienteId, Guid propiedadId, CrmDbContext context) =>
        {
            var rowsAffected = await context.LeadPropertyInterests
                .Where(i => i.ClienteId == clienteId && i.PropiedadId == propiedadId)
                .ExecuteDeleteAsync();

            if (rowsAffected == 0) return Results.NotFound("Vínculo de interés no encontrado.");

            return Results.NoContent();
        })
        .WithTags("Intereses")
        .WithName("DesvincularPropiedad");
    }
}
