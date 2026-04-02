using CRM_Inmobiliario.Api.Infrastructure.Persistence;
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
    public static void MapObtenerKpisEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/dashboard/kpis", async (CrmDbContext context) =>
        {
            var hoyUtc = DateTimeOffset.UtcNow;
            var limiteHoy = new DateTimeOffset(hoyUtc.Year, hoyUtc.Month, hoyUtc.Day, 23, 59, 59, hoyUtc.Offset);

            // 1. Propiedades Disponibles
            var totalPropiedades = await context.Properties
                .CountAsync(p => p.EstadoComercial == "Disponible");

            // 2. Prospectos Activos (No perdidos)
            var totalProspectos = await context.Leads
                .CountAsync(l => l.EtapaEmbudo != "Perdido");

            // 3. Tareas Pendientes Hoy (Pendientes y vencen hoy o antes)
            var tareasHoy = await context.Tasks
                .CountAsync(t => t.Estado == "Pendiente" && t.FechaVencimiento <= limiteHoy);

            // 4. Embudo de Ventas (Agrupado por Etapa)
            var embudo = await context.Leads
                .GroupBy(l => l.EtapaEmbudo)
                .Select(g => new EtapaEmbudoItem(g.Key ?? "Sin Etapa", g.Count()))
                .ToListAsync();

            var kpis = new DashboardKpisResponse(
                totalPropiedades,
                totalProspectos,
                tareasHoy,
                embudo
            );

            return Results.Ok(kpis);
        })
        .WithName("ObtenerKpis");
    }
}
