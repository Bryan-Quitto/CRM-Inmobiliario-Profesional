using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.Analitica;

public record ProyeccionResponse(decimal ProyeccionIngresos);

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

            // 1. Obtenemos los detalles de lo que vamos a sumar para debuggear
            var itemsProyeccion = await context.Leads
                .AsNoTracking()
                .Where(l => l.AgenteId == agenteId && l.EtapaEmbudo == "En Negociación")
                .SelectMany(l => l.PropertyInterests)
                .Where(i => i.Propiedad!.EstadoComercial == "Reservada")
                .Select(i => new {
                    i.Propiedad!.Titulo,
                    i.Propiedad!.Precio,
                    i.Propiedad!.PorcentajeComision,
                    ComisionCalculada = i.Propiedad!.Precio * (i.Propiedad!.PorcentajeComision / 100m)
                })
                .ToListAsync();

            logger.LogInformation("--- Iniciando Cálculo de Proyección para Agente {AgenteId} ---", agenteId);
            
            decimal total = 0;
            foreach (var item in itemsProyeccion)
            {
                logger.LogInformation("Propiedad: {Titulo} | Precio: {Precio} | Comision: {Porcentaje}% | Subtotal: {Subtotal}", 
                    item.Titulo, item.Precio, item.PorcentajeComision, item.ComisionCalculada);
                total += item.ComisionCalculada;
            }

            logger.LogInformation("Total Proyectado Final: {Total}", total);
            logger.LogInformation("--- Fin del Cálculo ---");

            return Results.Ok(new ProyeccionResponse(total));
        })
        .WithTags("Analitica")
        .WithName("ObtenerProyecciones")
        .CacheOutput(p => p.Tag("analytics-data").Expire(TimeSpan.FromMinutes(5)).SetVaryByHeader("Authorization"));
    }
}
