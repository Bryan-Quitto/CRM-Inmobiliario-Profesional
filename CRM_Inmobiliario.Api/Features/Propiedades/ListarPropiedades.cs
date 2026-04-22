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
        string Descripcion,
        string TipoPropiedad,
        string Operacion,
        decimal Precio,
        string Direccion,
        string Sector,
        string Ciudad,
        string? GoogleMapsUrl,
        string? UrlRemax,
        int Habitaciones,
        decimal Banos,
        decimal AreaTotal,
        decimal? AreaTerreno,
        decimal? AreaConstruccion,
        int? Estacionamientos,
        int? MediosBanos,
        int? AniosAntiguedad,
        string EstadoComercial,
        bool EsCaptacionPropia,
        decimal PorcentajeComision,
        DateTimeOffset FechaIngreso,
        string? ImagenPortadaUrl);

    public static RouteHandlerBuilder MapListarPropiedadesEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/propiedades", async (ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            var propiedades = await context.Properties
                .AsNoTracking()
                .Where(p => p.AgenteId == agenteId)
                .OrderByDescending(p => p.FechaIngreso)
                .Select(p => new Response(
                    p.Id,
                    p.Titulo,
                    p.Descripcion,
                    p.TipoPropiedad,
                    p.Operacion,
                    p.Precio,
                    p.Direccion,
                    p.Sector,
                    p.Ciudad,
                    p.GoogleMapsUrl,
                    p.UrlRemax,
                    p.Habitaciones,
                    p.Banos,
                    p.AreaTotal,
                    p.AreaTerreno,
                    p.AreaConstruccion,
                    p.Estacionamientos,
                    p.MediosBanos,
                    p.AniosAntiguedad,
                    p.EstadoComercial,
                    p.EsCaptacionPropia,
                    p.PorcentajeComision,
                    p.FechaIngreso,
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
