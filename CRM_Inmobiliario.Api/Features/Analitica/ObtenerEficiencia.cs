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
        return app.MapGet("/analitica/eficiencia", async (ClaimsPrincipal user, IDbContextFactory<CrmDbContext> factory) =>
        {
            var agenteId = user.GetRequiredUserId();

            using var ctxTotal = await factory.CreateDbContextAsync();
            using var ctxCerrados = await factory.CreateDbContextAsync();
            using var ctxAvg = await factory.CreateDbContextAsync();

            // 1. Definición de Tareas
            var totalLeadsTask = ctxTotal.Leads.AsNoTracking().CountAsync(l => l.AgenteId == agenteId);
            var cerradosTask = ctxCerrados.Leads.AsNoTracking().CountAsync(l => l.AgenteId == agenteId && l.EtapaEmbudo == "Cerrado");

            // Calculamos el promedio directamente en SQL (PostgreSQL)
            // Usamos un cast a double? para que AverageAsync devuelva un nullable
            var tiempoPromedioTask = ctxAvg.Leads
                .AsNoTracking()
                .Where(l => l.AgenteId == agenteId && l.EtapaEmbudo == "Cerrado" && l.FechaCierre != null)
                .Select(l => (double?)(l.FechaCierre!.Value - l.FechaCreacion).TotalDays)
                .AverageAsync();

            // 2. Ejecución paralela
            await Task.WhenAll(totalLeadsTask, cerradosTask, tiempoPromedioTask);

            // 3. Cálculos
            decimal tasaConversion = 0;
            if (totalLeadsTask.Result > 0)
            {
                tasaConversion = Math.Round((decimal)cerradosTask.Result / totalLeadsTask.Result * 100, 2);
            }

            // Convertimos el resultado de double? a decimal de forma segura
            decimal tiempoPromedioDias = Math.Round((decimal)(tiempoPromedioTask.Result ?? 0.0), 1);

            return Results.Ok(new EficienciaResponse(tasaConversion, tiempoPromedioDias));
        })
        .WithTags("Analitica")
        .WithName("ObtenerEficiencia")
        .CacheOutput(p => p.Expire(TimeSpan.FromSeconds(30)).SetVaryByHeader("Authorization"));
    }
}
