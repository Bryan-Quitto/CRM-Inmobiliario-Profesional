using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Analitica;

public record DetalleCierreEficiencia(Guid Id, string Cliente, string Propiedad, string FechaCreacion, string FechaCierre, double Dias);
public record EficienciaCalculos(int TotalLeads, int TotalCerrados, int LeadsConFechaCierre, List<DetalleCierreEficiencia> DetallesCierres);

public record EficienciaResponse(
    decimal TasaConversion,
    decimal TiempoPromedioCierreDias,
    EficienciaCalculos Calculos
);

public static class ObtenerEficienciaEndpoint
{
    public static IEndpointConventionBuilder MapObtenerEficienciaEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/analitica/eficiencia", async (ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            // OPTIMIZACIÓN: THE ONE TRIP PATTERN (Eficiencia con Detalles)
            var stats = await context.Agents
                .AsNoTracking()
                .Where(a => a.Id == agenteId)
                .Select(a => new
                {
                    TotalLeads = a.Leads.Count(),
                    TotalCerrados = a.Leads.Count(l => l.EtapaEmbudo == "Cerrado"),
                    LeadsConFechaCierre = a.Leads.Count(l => l.EtapaEmbudo == "Cerrado" && l.FechaCierre != null),
                    
                    // Detalles de cierres para el cálculo de velocidad
                    DetallesCierres = a.Leads
                        .Where(l => l.EtapaEmbudo == "Cerrado" && l.FechaCierre != null)
                        .OrderByDescending(l => l.FechaCierre)
                        .Select(l => new DetalleCierreEficiencia(
                            l.Id, 
                            l.Nombre + " " + l.Apellido, 
                            l.PropertyInterests.Where(i => i.Propiedad != null).Select(i => i.Propiedad!.Titulo).FirstOrDefault() ?? "Sin Propiedad",
                            l.FechaCreacion.ToString("yyyy-MM-dd"),
                            l.FechaCierre!.Value.ToString("yyyy-MM-dd"),
                            (l.FechaCierre!.Value - l.FechaCreacion).TotalDays
                        ))
                        .ToList(),

                    TiempoPromedioResult = a.Leads
                        .Where(l => l.EtapaEmbudo == "Cerrado" && l.FechaCierre != null)
                        .Select(l => (double?)(l.FechaCierre!.Value - l.FechaCreacion).TotalDays)
                        .Average()
                })
                .FirstOrDefaultAsync();

            if (stats == null) return Results.NotFound("Agente no encontrado");

            // Cálculos
            decimal tasaConversion = 0;
            if (stats.TotalLeads > 0)
            {
                tasaConversion = Math.Round((decimal)stats.TotalCerrados / stats.TotalLeads * 100, 2);
            }

            decimal tiempoPromedioDias = Math.Round((decimal)(stats.TiempoPromedioResult ?? 0.0), 1);

            var calculos = new EficienciaCalculos(stats.TotalLeads, stats.TotalCerrados, stats.LeadsConFechaCierre, stats.DetallesCierres);

            return Results.Ok(new EficienciaResponse(tasaConversion, tiempoPromedioDias, calculos));
        })
        .WithTags("Analitica")
        .WithName("ObtenerEficiencia")
        .CacheOutput(p => p.Tag("analytics-data").Expire(TimeSpan.FromMinutes(5)).SetVaryByHeader("Authorization"));
    }
}
