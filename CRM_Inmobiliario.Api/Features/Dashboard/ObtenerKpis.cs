using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Dashboard;

public record LeadDashboardItem(Guid Id, string Nombre, string Apellido, string EtapaEmbudo);

public record DashboardKpisResponse(
    int TotalPropiedadesDisponibles,
    int TotalProspectosActivos,
    int TareasPendientesHoy,
    int SeguimientoRequerido,
    List<LeadDashboardItem> LeadsSeguimiento,
    List<EtapaEmbudoItem> EmbudoVentas
);

public record EtapaEmbudoItem(string Etapa, int Cantidad);

public static class ObtenerKpisEndpoint
{
    public static RouteHandlerBuilder MapObtenerKpisEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/dashboard/kpis", async (DateTimeOffset? clientDate, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();
            
            // Si el cliente no manda fecha, usamos su UTC "actual"
            var baseDate = clientDate ?? DateTimeOffset.UtcNow;
            
            // Definimos el límite de "Hoy" para ese cliente (usamos el final del día siguiente para ser permisivos con zonas horarias)
            var limiteHoy = new DateTimeOffset(baseDate.Year, baseDate.Month, baseDate.Day, 23, 59, 59, baseDate.Offset).AddDays(1);
            
            var limiteHoyUtc = limiteHoy.ToUniversalTime();

            // 1. Ejecución secuencial (EF Core no permite paralelismo en el mismo DbContext)
            // Se usa AsNoTracking para maximizar el rendimiento.
            var propiedadesCount = await context.Properties
                .AsNoTracking()
                .CountAsync(p => p.AgenteId == agenteId && p.EstadoComercial == "Disponible");

            var prospectosCount = await context.Leads
                .AsNoTracking()
                .CountAsync(l => l.AgenteId == agenteId && l.EtapaEmbudo != "Perdido");

            // ACTUALIZAMOS LA CONSULTA PARA USAR limiteHoyUtc y ToLower() para el Estado
            var tareasCount = await context.Tasks
                .AsNoTracking()
                .CountAsync(t => t.AgenteId == agenteId && 
                                 t.Estado.ToLower() == "pendiente" && 
                                 t.FechaInicio <= limiteHoyUtc);

            // Seguimiento Crítico
            var etapasExcluidas = new[] { "En Negociación", "Cerrado", "Perdido" };
            var leadsSeguimiento = await context.Leads
                .AsNoTracking()
                .Where(l => l.AgenteId == agenteId && !etapasExcluidas.Contains(l.EtapaEmbudo))
                .Where(l => l.PropertyInterests.Any(i => i.NivelInteres == "Medio" || i.NivelInteres == "Alto"))
                .Select(l => new LeadDashboardItem(l.Id, l.Nombre, l.Apellido ?? "", l.EtapaEmbudo))
                .ToListAsync();

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
                leadsSeguimiento.Count,
                leadsSeguimiento,
                embudo
            );

            return Results.Ok(kpis);
        })
        .WithTags("Dashboard")
        .WithName("ObtenerKpis")
        .CacheOutput(p => p.Expire(TimeSpan.FromSeconds(30)).SetVaryByHeader("Authorization"));
    }
}
