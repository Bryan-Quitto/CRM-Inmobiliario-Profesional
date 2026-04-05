using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.Analitica;

public record SeguimientoResponse(int SeguimientoRequerido);

public static class ObtenerSeguimientoEndpoint
{
    public static IEndpointConventionBuilder MapObtenerSeguimientoEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/analitica/seguimiento", async (
            ClaimsPrincipal user, 
            CrmDbContext context,
            ILoggerFactory loggerFactory) =>
        {
            var logger = loggerFactory.CreateLogger("Analitica.Seguimiento");
            var agenteId = user.GetRequiredUserId();

            // Etapas que ya no se consideran "Seguimiento Crítico" porque ya están en proceso avanzado o finalizado
            var etapasExcluidas = new[] { "En Negociación", "Cerrado", "Perdido" };

            // D. Seguimiento Crítico: 
            // 1. Interés Medio o Alto
            // 2. Que NO estén en Negociación, Cerrados o Perdidos
            var leadsConInteres = await context.Leads
                .AsNoTracking()
                .Where(l => l.AgenteId == agenteId && !etapasExcluidas.Contains(l.EtapaEmbudo))
                .Where(l => l.PropertyInterests.Any(i => i.NivelInteres == "Medio" || i.NivelInteres == "Alto"))
                .Select(l => new { l.Nombre, l.Apellido, l.EtapaEmbudo })
                .ToListAsync();

            logger.LogInformation("--- Analizando Seguimiento Crítico (Filtrado) ---");
            foreach (var lead in leadsConInteres)
            {
                logger.LogInformation("Lead en seguimiento: {Nombre} {Apellido} | Etapa: {Etapa}", lead.Nombre, lead.Apellido, lead.EtapaEmbudo);
            }
            logger.LogInformation("Total Seguimiento Crítico: {Total}", leadsConInteres.Count);

            return Results.Ok(new SeguimientoResponse(leadsConInteres.Count));
        })
        .WithTags("Analitica")
        .WithName("ObtenerSeguimiento");
    }
}
