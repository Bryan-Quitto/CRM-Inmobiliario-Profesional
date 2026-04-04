using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class ObtenerPropiedadPorIdFeature
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
        int Habitaciones,
        decimal Banos,
        decimal AreaTotal,
        string EstadoComercial,
        DateTimeOffset FechaIngreso,
        IEnumerable<MediaResponse> Media);

    public record MediaResponse(
        Guid Id,
        string TipoMultimedia,
        string UrlPublica,
        bool EsPrincipal,
        int Orden);

    public static RouteHandlerBuilder MapObtenerPropiedadPorIdEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/propiedades/{id:guid}", async (Guid id, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            var propiedad = await context.Properties
                .Where(p => p.Id == id && p.AgenteId == agenteId)
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
                    p.Habitaciones,
                    p.Banos,
                    p.AreaTotal,
                    p.EstadoComercial,
                    p.FechaIngreso,
                    p.Media
                        .OrderBy(m => m.Orden)
                        .Select(m => new MediaResponse(
                            m.Id,
                            m.TipoMultimedia,
                            m.UrlPublica,
                            m.EsPrincipal,
                            m.Orden))))
                .FirstOrDefaultAsync();

            return propiedad is not null 
                ? Results.Ok(propiedad) 
                : Results.NotFound();
        })
        .WithTags("Propiedades")
        .WithName("ObtenerPropiedadPorId");
    }
}
