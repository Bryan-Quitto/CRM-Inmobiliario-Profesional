using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Dashboard;

public record DashboardKpisResponse(
    int TotalPropiedadesDisponibles,
    int TotalProspectosActivos,
    int TareasPendientesHoy,
    List<EtapaEmbudoItem> EmbudoVentas
);

public record EtapaEmbudoItem(string Etapa, int Cantidad);

public static class ObtenerKpisEndpoint
{
    public static RouteHandlerBuilder MapObtenerKpisEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/dashboard/kpis", async (ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();
            var hoyUtc = DateTimeOffset.UtcNow;
            var limiteHoy = new DateTimeOffset(hoyUtc.Year, hoyUtc.Month, hoyUtc.Day, 23, 59, 59, hoyUtc.Offset);

            // 1. Ejecución secuencial (EF Core no permite paralelismo en el mismo DbContext)
            // Se usa AsNoTracking para maximizar el rendimiento.
            var propiedadesCount = await context.Properties
                .AsNoTracking()
                .CountAsync(p => p.AgenteId == agenteId && p.EstadoComercial == "Disponible");

            var prospectosCount = await context.Leads
                .AsNoTracking()
                .CountAsync(l => l.AgenteId == agenteId && l.EtapaEmbudo != "Perdido");

            var tareasCount = await context.Tasks
                .AsNoTracking()
                .CountAsync(t => t.AgenteId == agenteId && t.Estado == "Pendiente" && t.FechaInicio <= limiteHoy);

            var embudo = await context.Leads
                .AsNoTracking()
                .Where(l => l.AgenteId == agenteId)
                .GroupBy(l => l.EtapaEmbudo)
                .Select(g => new EtapaEmbudoItem(g.Key ?? "Sin Etapa", g.Count()))
                .ToListAsync();

            var kpis = new DashboardKpisResponse(
                propiedadesCount,
                prospectosCount,
                tareasCount,
                embudo
            );

            return Results.Ok(kpis);
        })
        .WithTags("Dashboard")
        .WithName("ObtenerKpis")
        .CacheOutput(p => p.Expire(TimeSpan.FromSeconds(30)).SetVaryByHeader("Authorization"));
    }
}
