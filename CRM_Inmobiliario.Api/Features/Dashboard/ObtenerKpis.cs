using System.Security.Claims;
using System.Diagnostics;
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
            var swTotal = Stopwatch.StartNew();
            var agenteId = user.GetRequiredUserId();
            
            var baseDate = clientDate ?? DateTimeOffset.UtcNow;
            var limiteHoyUtc = new DateTimeOffset(baseDate.Year, baseDate.Month, baseDate.Day, 23, 59, 59, baseDate.Offset).ToUniversalTime();

            var etapasExcluidas = new[] { "En Negociación", "Cerrado", "Perdido" };

            // OPTIMIZACIÓN SUPREMA: "THE ONE TRIP PATTERN"
            // Agrupamos TODOS los cálculos en un solo comando SQL para minimizar el impacto 
            // de la latencia de red (1.3s por round-trip detectado).
            
            var swQuery = Stopwatch.StartNew();
            var megaData = await context.Agents
                .AsNoTracking()
                .Where(a => a.Id == agenteId)
                .Select(a => new
                {
                    Propiedades = a.Properties.Count(p => p.EstadoComercial == "Disponible"),
                    Prospectos = a.Leads.Count(l => l.EtapaEmbudo != "Perdido"),
                    Tareas = a.Tasks.Count(t => t.Estado == "Pendiente" && t.FechaInicio <= limiteHoyUtc),
                    
                    // Seguimiento (Proyectamos solo lo necesario)
                    LeadsSeguimiento = a.Leads
                        .Where(l => !etapasExcluidas.Contains(l.EtapaEmbudo) && l.PropertyInterests.Any(i => i.NivelInteres == "Medio" || i.NivelInteres == "Alto"))
                        .Select(l => new LeadDashboardItem(l.Id, l.Nombre, l.Apellido ?? "", l.EtapaEmbudo))
                        .ToList(),

                    // Embudo (Agrupación en memoria tras traer el resumen por etapa)
                    EmbudoRaw = a.Leads
                        .GroupBy(l => l.EtapaEmbudo)
                        .Select(g => new { Etapa = g.Key, Cantidad = g.Count() })
                        .ToList()
                })
                .FirstOrDefaultAsync();
            swQuery.Stop();

            if (megaData == null) return Results.NotFound("Agente no encontrado");

            var embudoFinal = megaData.EmbudoRaw
                .Select(x => new EtapaEmbudoItem(x.Etapa ?? "Sin Etapa", x.Cantidad))
                .ToList();

            swTotal.Stop();

            // IMPRESIÓN DE DIAGNÓSTICO EN TERMINAL
            Console.WriteLine("\n⚡ [PERFORMANCE: THE ONE TRIP]");
            Console.WriteLine($"   |-- 📡 Latencia Única DB: {swQuery.ElapsedMilliseconds}ms (Incluye Network + Query)");
            Console.WriteLine($"   |-- 🧠 Procesamiento:    {swTotal.ElapsedMilliseconds - swQuery.ElapsedMilliseconds}ms");
            Console.WriteLine($"   |-- ✅ TIEMPO TOTAL:     {swTotal.ElapsedMilliseconds}ms");
            Console.WriteLine("---------------------------------------\n");

            var kpis = new DashboardKpisResponse(
                megaData.Propiedades,
                megaData.Prospectos,
                megaData.Tareas,
                megaData.LeadsSeguimiento.Count,
                megaData.LeadsSeguimiento,
                embudoFinal
            );

            return Results.Ok(kpis);
        })
        .WithTags("Dashboard")
        .WithName("ObtenerKpis")
        .CacheOutput(p => p.Tag("dashboard-data").Expire(TimeSpan.FromMinutes(5)).SetVaryByHeader("Authorization").SetVaryByQuery("clientDate"));
    }
}
