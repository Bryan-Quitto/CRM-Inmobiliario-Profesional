using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class BuscarPropiedadesFeature
{
    public record PropiedadBusquedaResponse(Guid Id, string Titulo, string Ciudad, string Sector);

    public static void MapBuscarPropiedadesEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/propiedades/buscar", async (string query, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            if (string.IsNullOrWhiteSpace(query))
            {
                return Results.Ok(Enumerable.Empty<PropiedadBusquedaResponse>());
            }

            var normalizedQuery = query.Trim().ToLower();

            var propiedades = await context.Properties
                .AsNoTracking()
                .Where(p => p.AgenteId == agenteId)
                .Where(p => p.Titulo.ToLower().Contains(normalizedQuery))
                .OrderBy(p => p.Titulo)
                .Take(20)
                .Select(p => new PropiedadBusquedaResponse(
                    p.Id, 
                    p.Titulo, 
                    p.Ciudad, 
                    p.Sector))
                .ToListAsync();

            return Results.Ok(propiedades);
        })
        .WithTags("Propiedades")
        .WithName("BuscarPropiedades");
    }
}
