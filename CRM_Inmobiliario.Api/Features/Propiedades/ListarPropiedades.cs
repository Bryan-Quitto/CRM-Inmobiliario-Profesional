using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class ListarPropiedadesFeature
{
    public record Response(
        Guid Id,
        string Titulo,
        string TipoPropiedad,
        string Operacion,
        decimal Precio,
        string Sector,
        string Ciudad,
        string EstadoComercial);

    public static void MapListarPropiedadesEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/propiedades", async (CrmDbContext context) =>
        {
            var propiedades = await context.Properties
                .OrderByDescending(p => p.FechaIngreso)
                .Select(p => new Response(
                    p.Id,
                    p.Titulo,
                    p.TipoPropiedad,
                    p.Operacion,
                    p.Precio,
                    p.Sector,
                    p.Ciudad,
                    p.EstadoComercial))
                .ToListAsync();

            return Results.Ok(propiedades);
        })
        .WithTags("Propiedades")
        .WithName("ListarPropiedades");
    }
}
