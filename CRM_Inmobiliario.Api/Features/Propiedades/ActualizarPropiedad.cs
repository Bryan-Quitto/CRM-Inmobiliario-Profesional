using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.OutputCaching;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class ActualizarPropiedadFeature
{
    public record Command(
        string Titulo,
        string Descripcion,
        string TipoPropiedad,
        string Operacion,
        decimal Precio,
        string Direccion,
        string Sector,
        string Ciudad,
        string? GoogleMapsUrl,
        string? UrlRemax,
        int Habitaciones,
        decimal Banos,
        decimal AreaTotal,
        decimal? AreaTerreno,
        decimal? AreaConstruccion,
        int? Estacionamientos,
        int? MediosBanos,
        int? AniosAntiguedad,
        bool EsCaptacionPropia,
        decimal PorcentajeComision,
        DateTimeOffset? FechaIngreso = null);

    public static void MapActualizarPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPut("/propiedades/{id:guid}", async (Guid id, Command command, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();

            var propiedad = await context.Properties
                .FirstOrDefaultAsync(p => p.Id == id && p.AgenteId == agenteId);

            if (propiedad is null)
            {
                return Results.NotFound();
            }

            propiedad.Titulo = command.Titulo;
            propiedad.Descripcion = command.Descripcion;
            propiedad.TipoPropiedad = command.TipoPropiedad;
            propiedad.Operacion = command.Operacion;
            propiedad.Precio = command.Precio;
            propiedad.Direccion = command.Direccion;
            propiedad.Sector = command.Sector;
            propiedad.Ciudad = command.Ciudad;
            propiedad.GoogleMapsUrl = command.GoogleMapsUrl;
            propiedad.UrlRemax = command.UrlRemax;
            propiedad.Habitaciones = command.Habitaciones;
            propiedad.Banos = command.Banos;
            propiedad.AreaTotal = command.AreaTotal;
            propiedad.AreaTerreno = command.AreaTerreno;
            propiedad.AreaConstruccion = command.AreaConstruccion;
            propiedad.Estacionamientos = command.Estacionamientos;
            propiedad.MediosBanos = command.MediosBanos;
            propiedad.AniosAntiguedad = command.AniosAntiguedad;
            propiedad.EsCaptacionPropia = command.EsCaptacionPropia;
            propiedad.PorcentajeComision = command.PorcentajeComision;
            
            if (command.FechaIngreso.HasValue)
            {
                propiedad.FechaIngreso = command.FechaIngreso.Value;
            }

            await context.SaveChangesAsync();

            // Invalidar caches proactivamente
            await cacheStore.EvictByTagAsync("dashboard-data", ct);
            await cacheStore.EvictByTagAsync("analytics-data", ct);
            await cacheStore.EvictByTagAsync("properties-data", ct);

            return Results.NoContent();
        })
        .WithTags("Propiedades")
        .WithName("ActualizarPropiedad");
    }
}
