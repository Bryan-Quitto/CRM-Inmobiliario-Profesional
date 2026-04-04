using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Analitica;

public record EficienciaResponse(
    decimal TasaConversion,
    decimal TiempoPromedioCierreDias
);

public static class ObtenerEficienciaEndpoint
{
    public static IEndpointConventionBuilder MapObtenerEficienciaEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/analitica/eficiencia", async (ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            // 1. Tasa de Conversión: (Cerrados / Total) * 100
            var totalLeads = await context.Leads.CountAsync(l => l.AgenteId == agenteId);
            var cerrados = await context.Leads.CountAsync(l => l.AgenteId == agenteId && l.EtapaEmbudo == "Cerrado");

            decimal tasaConversion = 0;
            if (totalLeads > 0)
            {
                tasaConversion = Math.Round((decimal)cerrados / totalLeads * 100, 2);
            }

            // 2. Tiempo Promedio de Cierre: Promedio de (FechaCierre - FechaCreacion) en días
            // Filtramos los que tienen FechaCierre para el cálculo
            var leadsCerrados = await context.Leads
                .Where(l => l.AgenteId == agenteId && l.EtapaEmbudo == "Cerrado" && l.FechaCierre != null)
                .Select(l => new { l.FechaCreacion, l.FechaCierre })
                .ToListAsync();

            decimal tiempoPromedioDias = 0;
            if (leadsCerrados.Any())
            {
                var totalDias = leadsCerrados.Sum(l => (l.FechaCierre!.Value - l.FechaCreacion).TotalDays);
                tiempoPromedioDias = Math.Round((decimal)totalDias / leadsCerrados.Count, 1);
            }

            return Results.Ok(new EficienciaResponse(tasaConversion, tiempoPromedioDias));
        })
        .WithTags("Analitica")
        .WithName("ObtenerEficiencia");
    }
}
