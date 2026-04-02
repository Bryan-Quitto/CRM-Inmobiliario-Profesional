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
    public static void MapObtenerKpisEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/dashboard/kpis", async (ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();
            var hoyUtc = DateTimeOffset.UtcNow;
            var limiteHoy = new DateTimeOffset(hoyUtc.Year, hoyUtc.Month, hoyUtc.Day, 23, 59, 59, hoyUtc.Offset);

            // 1. Propiedades Disponibles del Agente
            var totalPropiedades = await context.Properties
                .CountAsync(p => p.AgenteId == agenteId && p.EstadoComercial == "Disponible");

            // 2. Prospectos Activos del Agente
            var totalProspectos = await context.Leads
                .CountAsync(l => l.AgenteId == agenteId && l.EtapaEmbudo != "Perdido");

            // 3. Tareas Pendientes Hoy del Agente
            var tareasHoy = await context.Tasks
                .CountAsync(t => t.AgenteId == agenteId && t.Estado == "Pendiente" && t.FechaVencimiento <= limiteHoy);

            // 4. Embudo de Ventas del Agente
            var embudo = await context.Leads
                .Where(l => l.AgenteId == agenteId)
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
        .WithTags("Dashboard")
        .WithName("ObtenerKpis");
    }
}
