using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Analitica;

public record DetalleCierreEficiencia(Guid Id, string Contacto, string Propiedad, string FechaCreacion, string FechaCierre, double Dias);
public record EficienciaCalculos(int TotalContactos, int TotalCerrados, int ContactosConFechaCierre, List<DetalleCierreEficiencia> DetallesCierres);

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
                    TotalContactos = a.Contactos.Count(),
                    TotalCerrados = a.Properties.SelectMany(p => p.Transactions)
                        .Count(t => (t.TransactionType == "Sale" || t.TransactionType == "Rent") && t.TransactionStatus != "Cancelled"),
                    ContactosConFechaCierre = a.Properties.SelectMany(p => p.Transactions)
                        .Count(t => (t.TransactionType == "Sale" || t.TransactionType == "Rent") && t.TransactionStatus != "Cancelled" && t.ContactoId != null),
                    
                    // Detalles de cierres para el cálculo de velocidad
                    DetallesCierres = a.Properties.SelectMany(p => p.Transactions)
                        .Where(t => (t.TransactionType == "Sale" || t.TransactionType == "Rent") && t.TransactionStatus != "Cancelled" && t.ContactoId != null)
                        .OrderByDescending(t => t.TransactionDate)
                        .Select(t => new DetalleCierreEficiencia(
                            t.Id, 
                            t.Contacto!.Nombre + " " + t.Contacto.Apellido, 
                            t.Property!.Titulo,
                            t.Contacto.FechaCreacion.ToString("yyyy-MM-dd"),
                            t.TransactionDate.ToString("yyyy-MM-dd"),
                            (t.TransactionDate - t.Contacto.FechaCreacion).TotalDays
                        ))
                        .ToList(),

                    TiempoPromedioResult = a.Properties.SelectMany(p => p.Transactions)
                        .Where(t => (t.TransactionType == "Sale" || t.TransactionType == "Rent") && t.TransactionStatus != "Cancelled" && t.ContactoId != null)
                        .Select(t => (double?)(t.TransactionDate - t.Contacto!.FechaCreacion).TotalDays)
                        .Average()
                })
                .FirstOrDefaultAsync();

            if (stats == null) return Results.NotFound("Agente no encontrado");

            // Cálculos
            decimal tasaConversion = 0;
            if (stats.TotalContactos > 0)
            {
                tasaConversion = Math.Round((decimal)stats.TotalCerrados / stats.TotalContactos * 100, 2);
            }

            decimal tiempoPromedioDias = Math.Round((decimal)(stats.TiempoPromedioResult ?? 0.0), 1);

            var calculos = new EficienciaCalculos(stats.TotalContactos, stats.TotalCerrados, stats.ContactosConFechaCierre, stats.DetallesCierres);

            return Results.Ok(new EficienciaResponse(tasaConversion, tiempoPromedioDias, calculos));
        })
        .WithTags("Analitica")
        .WithName("ObtenerEficiencia")
        .CacheOutput(p => p.Tag("analytics-data").Expire(TimeSpan.FromMinutes(5)).SetVaryByHeader("Authorization"));
    }
}
