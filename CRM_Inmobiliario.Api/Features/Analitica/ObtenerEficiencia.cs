using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Analitica;

public record DetalleCierreEficiencia(Guid Id, string Contacto, string Propiedad, string FechaCreacion, string FechaCierre, double Dias);

public record EficienciaCalculos(
    int TotalContactos, 
    int TotalCerradosVendedor, 
    int ContactosConFechaCierre, 
    int TotalCaptaciones,
    int TotalCerradosCaptador,
    int CaptacionesConFechaCierre,
    List<DetalleCierreEficiencia> DetallesCierres
);

public record EficienciaResponse(
    decimal TasaConversionGlobal,
    decimal TasaConversionVendedor,
    decimal TasaConversionCaptador,
    decimal TiempoPromedioGlobalDias,
    decimal TiempoPromedioVendedorDias,
    decimal TiempoPromedioCaptadorDias,
    EficienciaCalculos Calculos
);

public static class ObtenerEficienciaEndpoint
{
    public static IEndpointConventionBuilder MapObtenerEficienciaEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/analitica/eficiencia", async (ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            var stats = await context.Agents
                .AsNoTracking()
                .Where(a => a.Id == agenteId)
                .Select(a => new
                {
                    TotalContactos = a.Contactos.Count(),
                    TotalCerradosVendedor = context.PropertyTransactions
                        .Count(t => (t.TransactionType == "Sale" || t.TransactionType == "Rent") && 
                                    t.TransactionStatus != "Cancelled" && 
                                    t.Contacto != null && t.Contacto.AgenteId == agenteId),
                    ContactosConFechaCierre = context.PropertyTransactions
                        .Count(t => (t.TransactionType == "Sale" || t.TransactionType == "Rent") && 
                                    t.TransactionStatus != "Cancelled" && 
                                    t.ContactoId != null && 
                                    t.Contacto!.AgenteId == agenteId),
                    
                    TotalCaptaciones = a.Properties.Count(),
                    TotalCerradosCaptador = context.PropertyTransactions
                        .Count(t => (t.TransactionType == "Sale" || t.TransactionType == "Rent") && 
                                    t.TransactionStatus != "Cancelled" && 
                                    t.Property != null && t.Property.AgenteId == agenteId),
                    CaptacionesConFechaCierre = context.PropertyTransactions
                        .Count(t => (t.TransactionType == "Sale" || t.TransactionType == "Rent") && 
                                    t.TransactionStatus != "Cancelled" && 
                                    t.Property != null && t.Property.AgenteId == agenteId),

                    TotalCerradosGlobal = context.PropertyTransactions
                        .Count(t => (t.TransactionType == "Sale" || t.TransactionType == "Rent") && 
                                    t.TransactionStatus != "Cancelled" && 
                                    (t.Property!.AgenteId == agenteId || (t.Contacto != null && t.Contacto.AgenteId == agenteId))),

                    DetallesCierres = context.PropertyTransactions
                        .Where(t => (t.TransactionType == "Sale" || t.TransactionType == "Rent") && 
                                    t.TransactionStatus != "Cancelled" && 
                                    t.ContactoId != null && 
                                    (t.Property!.AgenteId == agenteId || t.Contacto!.AgenteId == agenteId))
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

                    TiempoPromedioVendedorResult = context.PropertyTransactions
                        .Where(t => (t.TransactionType == "Sale" || t.TransactionType == "Rent") && 
                                    t.TransactionStatus != "Cancelled" && 
                                    t.ContactoId != null && 
                                    t.Contacto!.AgenteId == agenteId)
                        .Select(t => (double?)(t.TransactionDate - t.Contacto!.FechaCreacion).TotalDays)
                        .Average(),

                    TiempoPromedioCaptadorResult = context.PropertyTransactions
                        .Where(t => (t.TransactionType == "Sale" || t.TransactionType == "Rent") && 
                                    t.TransactionStatus != "Cancelled" && 
                                    t.Property != null && t.Property.AgenteId == agenteId)
                        .Select(t => (double?)(t.TransactionDate - t.Property!.FechaIngreso).TotalDays)
                        .Average()
                })
                .FirstOrDefaultAsync();

            if (stats == null) return Results.NotFound("Agente no encontrado");

            decimal tasaConversionVendedor = 0;
            if (stats.TotalContactos > 0)
                tasaConversionVendedor = Math.Round((decimal)stats.TotalCerradosVendedor / stats.TotalContactos * 100, 2);

            decimal tasaConversionCaptador = 0;
            if (stats.TotalCaptaciones > 0)
                tasaConversionCaptador = Math.Round((decimal)stats.TotalCerradosCaptador / stats.TotalCaptaciones * 100, 2);

            int universoGlobal = stats.TotalContactos + stats.TotalCaptaciones;
            decimal tasaConversionGlobal = 0;
            if (universoGlobal > 0)
                tasaConversionGlobal = Math.Round((decimal)stats.TotalCerradosGlobal / universoGlobal * 100, 2);

            decimal tiempoVendedor = Math.Round((decimal)(stats.TiempoPromedioVendedorResult ?? 0.0), 1);
            decimal tiempoCaptador = Math.Round((decimal)(stats.TiempoPromedioCaptadorResult ?? 0.0), 1);
            
            decimal tiempoGlobal = 0;
            if (tiempoVendedor > 0 && tiempoCaptador > 0) tiempoGlobal = Math.Round((tiempoVendedor + tiempoCaptador) / 2, 1);
            else if (tiempoVendedor > 0) tiempoGlobal = tiempoVendedor;
            else if (tiempoCaptador > 0) tiempoGlobal = tiempoCaptador;

            var calculos = new EficienciaCalculos(
                stats.TotalContactos, 
                stats.TotalCerradosVendedor, 
                stats.ContactosConFechaCierre, 
                stats.TotalCaptaciones,
                stats.TotalCerradosCaptador,
                stats.CaptacionesConFechaCierre,
                stats.DetallesCierres
            );

            return Results.Ok(new EficienciaResponse(
                tasaConversionGlobal, 
                tasaConversionVendedor, 
                tasaConversionCaptador, 
                tiempoGlobal, 
                tiempoVendedor, 
                tiempoCaptador, 
                calculos
            ));
        })
        .WithTags("Analitica")
        .WithName("ObtenerEficiencia")
        .CacheOutput(p => p.Tag("analytics-data").Expire(TimeSpan.FromMinutes(5)).SetVaryByHeader("Authorization"));
    }
}
