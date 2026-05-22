using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Analitica;

public record TrendPoint(string Fecha, int Visitas, int Cierres, int Captaciones);

public record KpiVisita(Guid Id, string Titulo, string Fecha, string? Contacto, string? Propiedad);
public record KpiCierre(Guid Id, string Contacto, string Propiedad, string FechaCierre);
public record KpiOferta(Guid Id, string Contacto, string Propiedad, string Fecha);
public record KpiCaptacion(Guid Id, string Titulo, string Fecha, decimal Precio);

public record ActividadDetalles(
    List<KpiVisita> Visitas,
    List<KpiCierre> Cierres,
    List<KpiOferta> Ofertas,
    List<KpiCaptacion> Captaciones
);

public record ActividadResponse(
    int VisitasCompletadas,
    int CierresRealizados,
    int OfertasGeneradas,
    int CaptacionesPropias,
    List<TrendPoint> Trend,
    ActividadDetalles Detalles
);

public static class ObtenerActividadEndpoint
{
    public static IEndpointConventionBuilder MapObtenerActividadEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/analitica/actividad", async (
            DateTimeOffset inicio, 
            DateTimeOffset fin, 
            ClaimsPrincipal user, 
            CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            // OPTIMIZACIÓN SUPREMA: "THE ONE TRIP PATTERN"
            // Consolidamos Conteos, Detalles y Raw Dates en una única proyección LINQ
            var megaData = await context.Agents
                .AsNoTracking()
                .Where(a => a.Id == agenteId)
                .Select(a => new
                {
                    // Conteos Rápidos
                    VisitasCount = a.Tasks.Count(t => (t.TipoTarea == "Visita" || t.TipoTarea == "Cita") && t.Estado == "Completada" && t.FechaInicio >= inicio && t.FechaInicio <= fin),
                    CierresCount = context.PropertyTransactions.Count(t => 
                        (t.TransactionType == "Sale" || t.TransactionType == "Rent") && 
                        t.TransactionStatus != "Cancelled" && 
                        t.TransactionDate >= inicio && t.TransactionDate <= fin &&
                        (t.Property!.AgenteId == agenteId || (t.Contacto != null && t.Contacto.AgenteId == agenteId))),
                    OfertasCount = context.ContactoHistorialEmbudos.Where(h => h.EtapaNueva == "En Negociación" && h.FechaCambio >= inicio && h.FechaCambio <= fin && h.Contacto!.AgenteId == agenteId).Select(h => h.ContactoId).Distinct().Count(),
                    CaptacionesCount = a.Properties.Count(p => p.EsCaptacionPropia && p.FechaIngreso >= inicio && p.FechaIngreso <= fin),

                    // Detalles para Modales (Proyectados directamente a DTOs)
                    DetallesVisitas = a.Tasks
                        .Where(t => (t.TipoTarea == "Visita" || t.TipoTarea == "Cita") && t.Estado == "Completada" && t.FechaInicio >= inicio && t.FechaInicio <= fin)
                        .OrderByDescending(t => t.FechaInicio)
                        .Select(t => new KpiVisita(t.Id, t.Titulo, t.FechaInicio.ToString("yyyy-MM-dd HH:mm"), t.Contacto != null ? (t.Contacto.Nombre + " " + t.Contacto.Apellido) : null, t.Propiedad != null ? t.Propiedad.Titulo : null))
                        .ToList(),
                    DetallesCierres = context.PropertyTransactions
                        .Where(t => (t.TransactionType == "Sale" || t.TransactionType == "Rent") && 
                                    t.TransactionStatus != "Cancelled" && 
                                    t.TransactionDate >= inicio && t.TransactionDate <= fin &&
                                    (t.Property!.AgenteId == agenteId || (t.Contacto != null && t.Contacto.AgenteId == agenteId)))
                        .OrderByDescending(t => t.TransactionDate)
                        .Select(t => new KpiCierre(t.Id, t.Contacto != null ? t.Contacto.Nombre + " " + t.Contacto.Apellido : "Sin Contacto", t.Property!.Titulo, t.TransactionDate.ToString("yyyy-MM-dd")))
                        .ToList(),
                    DetallesOfertas = context.Contactos
                        .Where(c => c.AgenteId == agenteId && c.HistorialEmbudo.Any(h => h.EtapaNueva == "En Negociación" && h.FechaCambio >= inicio && h.FechaCambio <= fin))
                        .Select(c => new KpiOferta(
                            c.Id, 
                            c.Nombre + " " + c.Apellido, 
                            context.Properties.Where(p => p.CerradoConId == c.Id && p.EstadoComercial == "Reservada").Select(p => p.Titulo).FirstOrDefault() ?? "Sin Propiedad", 
                            c.HistorialEmbudo.Where(h => h.EtapaNueva == "En Negociación" && h.FechaCambio >= inicio && h.FechaCambio <= fin).Max(h => h.FechaCambio).ToString("yyyy-MM-dd")
                        ))
                        .ToList(),
                    DetallesCaptaciones = a.Properties
                        .Where(p => p.EsCaptacionPropia && p.FechaIngreso >= inicio && p.FechaIngreso <= fin)
                        .OrderByDescending(p => p.FechaIngreso)
                        .Select(p => new KpiCaptacion(p.Id, p.Titulo, p.FechaIngreso.ToString("yyyy-MM-dd"), p.Precio))
                        .ToList(),

                    // Datos para Tendencias (Raw dates para procesar en memoria)
                    RawVisitas = a.Tasks
                        .Where(t => (t.TipoTarea == "Visita" || t.TipoTarea == "Cita") && t.Estado == "Completada" && t.FechaInicio >= inicio && t.FechaInicio <= fin)
                        .Select(t => t.FechaInicio)
                        .ToList(),
                    RawCierres = context.PropertyTransactions
                        .Where(t => (t.TransactionType == "Sale" || t.TransactionType == "Rent") && 
                                    t.TransactionStatus != "Cancelled" && 
                                    t.TransactionDate >= inicio && t.TransactionDate <= fin &&
                                    (t.Property!.AgenteId == agenteId || (t.Contacto != null && t.Contacto.AgenteId == agenteId)))
                        .Select(t => t.TransactionDate)
                        .ToList(),
                    RawCaptaciones = a.Properties
                        .Where(p => p.EsCaptacionPropia && p.FechaIngreso >= inicio && p.FechaIngreso <= fin)
                        .Select(p => p.FechaIngreso)
                        .ToList()
                })
                .FirstOrDefaultAsync();

            if (megaData == null) return Results.NotFound("Agente no encontrado");

            // PROCESAMIENTO EN MEMORIA: Generación de la línea de tiempo (Trend)
            var trend = new List<TrendPoint>();
            var vDict = megaData.RawVisitas.GroupBy(x => x.Date).ToDictionary(g => g.Key, g => g.Count());
            var cDict = megaData.RawCierres.GroupBy(x => x.Date).ToDictionary(g => g.Key, g => g.Count());
            var capDict = megaData.RawCaptaciones.GroupBy(x => x.Date).ToDictionary(g => g.Key, g => g.Count());

            for (var dt = inicio.Date; dt <= fin.Date; dt = dt.AddDays(1))
            {
                trend.Add(new TrendPoint(
                    dt.ToString("dd MMM"), 
                    vDict.GetValueOrDefault(dt, 0), 
                    cDict.GetValueOrDefault(dt, 0), 
                    capDict.GetValueOrDefault(dt, 0)));
            }

            var detalles = new ActividadDetalles(
                megaData.DetallesVisitas,
                megaData.DetallesCierres,
                megaData.DetallesOfertas,
                megaData.DetallesCaptaciones
            );

            return Results.Ok(new ActividadResponse(
                megaData.VisitasCount, 
                megaData.CierresCount, 
                megaData.OfertasCount, 
                megaData.CaptacionesCount, 
                trend,
                detalles));
        })
        .WithTags("Analitica")
        .WithName("ObtenerActividad")
        .CacheOutput(p => p.Tag("analytics-data").Expire(TimeSpan.FromMinutes(5)).SetVaryByHeader("Authorization").SetVaryByQuery("inicio", "fin"));
    }
}
