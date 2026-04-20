using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.Analitica;

public record ItemCalculoProyeccion(string Propiedad, decimal Precio, decimal PorcentajeComision, decimal ComisionCalculada);

public record ProyeccionResponse(
    decimal ProyeccionIngresos,
    List<ItemCalculoProyeccion> Desglose
);

public static class ObtenerProyeccionesEndpoint
{
    public static IEndpointConventionBuilder MapObtenerProyeccionesEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/analitica/proyecciones", async (
            ClaimsPrincipal user, 
            CrmDbContext context,
            ILoggerFactory loggerFactory) =>
        {
            var logger = loggerFactory.CreateLogger("Analitica.Proyecciones");
            var agenteId = user.GetRequiredUserId();

            // 1. Obtenemos los detalles de lo que vamos a sumar (ONE TRIP)
            var itemsProyeccion = await context.Leads
                .AsNoTracking()
                .Where(l => l.AgenteId == agenteId && l.EtapaEmbudo == "En Negociación")
                .SelectMany(l => l.PropertyInterests)
                .Where(i => i.Propiedad!.EstadoComercial == "Reservada")
                .Select(i => new ItemCalculoProyeccion(
                    i.Propiedad!.Titulo,
                    i.Propiedad!.Precio,
                    i.Propiedad!.PorcentajeComision,
                    i.Propiedad!.Precio * (i.Propiedad!.PorcentajeComision / 100m)
                ))
                .ToListAsync();

            decimal total = itemsProyeccion.Sum(i => i.ComisionCalculada);

            return Results.Ok(new ProyeccionResponse(total, itemsProyeccion));
        })
        .WithTags("Analitica")
        .WithName("ObtenerProyecciones")
        .CacheOutput(p => p.Tag("analytics-data").Expire(TimeSpan.FromMinutes(5)).SetVaryByHeader("Authorization"));
    }
}
