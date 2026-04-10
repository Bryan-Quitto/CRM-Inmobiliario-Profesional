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

            // 1. Ejecución secuencial (EF Core no permite paralelismo en el mismo DbContext)
            var totalLeadsCount = await context.Leads.AsNoTracking().CountAsync(l => l.AgenteId == agenteId);
            var cerradosCount = await context.Leads.AsNoTracking().CountAsync(l => l.AgenteId == agenteId && l.EtapaEmbudo == "Cerrado");

            // Calculamos el promedio directamente en SQL (PostgreSQL)
            var tiempoPromedioResult = await context.Leads
                .AsNoTracking()
                .Where(l => l.AgenteId == agenteId && l.EtapaEmbudo == "Cerrado" && l.FechaCierre != null)
                .Select(l => (double?)(l.FechaCierre!.Value - l.FechaCreacion).TotalDays)
                .AverageAsync();

            // 2. Cálculos
            decimal tasaConversion = 0;
            if (totalLeadsCount > 0)
            {
                tasaConversion = Math.Round((decimal)cerradosCount / totalLeadsCount * 100, 2);
            }

            // Convertimos el resultado de double? a decimal de forma segura
            decimal tiempoPromedioDias = Math.Round((decimal)(tiempoPromedioResult ?? 0.0), 1);

            return Results.Ok(new EficienciaResponse(tasaConversion, tiempoPromedioDias));
        })
        .WithTags("Analitica")
        .WithName("ObtenerEficiencia")
        .CacheOutput(p => p.Tag("analytics-data").Expire(TimeSpan.FromMinutes(5)).SetVaryByHeader("Authorization"));
    }
}
