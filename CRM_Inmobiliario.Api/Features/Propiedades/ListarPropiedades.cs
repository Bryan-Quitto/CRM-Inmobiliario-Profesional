using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
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
        string EstadoComercial,
        bool EsCaptacionPropia,
        decimal PorcentajeComision,
        string? ImagenPortadaUrl);

    public static RouteHandlerBuilder MapListarPropiedadesEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/propiedades", async (ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            var propiedades = await context.Properties
                .Where(p => p.AgenteId == agenteId)
                .OrderByDescending(p => p.FechaIngreso)
                .Select(p => new Response(
                    p.Id,
                    p.Titulo,
                    p.TipoPropiedad,
                    p.Operacion,
                    p.Precio,
                    p.Sector,
                    p.Ciudad,
                    p.EstadoComercial,
                    p.EsCaptacionPropia,
                    p.PorcentajeComision,
                    p.Media
                        .Where(m => m.EsPrincipal)
                        .Select(m => m.UrlPublica)
                        .FirstOrDefault()))
                .ToListAsync();

            return Results.Ok(propiedades);
        })
        .WithTags("Propiedades")
        .WithName("ListarPropiedades");
    }
}
