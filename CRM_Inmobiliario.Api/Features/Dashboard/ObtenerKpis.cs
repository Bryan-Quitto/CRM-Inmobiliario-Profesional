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
        return app.MapGet("/dashboard/kpis", async (ClaimsPrincipal user, IDbContextFactory<CrmDbContext> factory) =>
        {
            var agenteId = user.GetRequiredUserId();
            var hoyUtc = DateTimeOffset.UtcNow;
            var limiteHoy = new DateTimeOffset(hoyUtc.Year, hoyUtc.Month, hoyUtc.Day, 23, 59, 59, hoyUtc.Offset);

            // 1. Creamos contextos independientes para permitir el paralelismo real (Thread-Safe)
            using var ctxProp = await factory.CreateDbContextAsync();
            using var ctxLead = await factory.CreateDbContextAsync();
            using var ctxTask = await factory.CreateDbContextAsync();
            using var ctxEmbudo = await factory.CreateDbContextAsync();

            // 2. Definición de tareas paralelas con AsNoTracking
            var propiedadesTask = ctxProp.Properties
                .AsNoTracking()
                .CountAsync(p => p.AgenteId == agenteId && p.EstadoComercial == "Disponible");

            var prospectosTask = ctxLead.Leads
                .AsNoTracking()
                .CountAsync(l => l.AgenteId == agenteId && l.EtapaEmbudo != "Perdido");

            var tareasTask = ctxTask.Tasks
                .AsNoTracking()
                .CountAsync(t => t.AgenteId == agenteId && t.Estado == "Pendiente" && t.FechaInicio <= limiteHoy);

            var embudoTask = ctxEmbudo.Leads
                .AsNoTracking()
                .Where(l => l.AgenteId == agenteId)
                .GroupBy(l => l.EtapaEmbudo)
                .Select(g => new EtapaEmbudoItem(g.Key ?? "Sin Etapa", g.Count()))
                .ToListAsync();

            // 3. Ejecución simultánea
            await Task.WhenAll(propiedadesTask, prospectosTask, tareasTask, embudoTask);

            var kpis = new DashboardKpisResponse(
                propiedadesTask.Result,
                prospectosTask.Result,
                tareasTask.Result,
                embudoTask.Result
            );

            return Results.Ok(kpis);
        })
        .WithTags("Dashboard")
        .WithName("ObtenerKpis")
        .CacheOutput(p => p.Expire(TimeSpan.FromSeconds(30)).SetVaryByHeader("Authorization"));
    }
}
