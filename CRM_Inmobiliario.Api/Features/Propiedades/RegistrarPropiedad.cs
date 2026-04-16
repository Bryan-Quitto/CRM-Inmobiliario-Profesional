using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Features.Dashboard;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.OutputCaching;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class RegistrarPropiedadFeature
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
        decimal? AreaTerreno = null,
        decimal? AreaConstruccion = null,
        int? Estacionamientos = null,
        int? MediosBanos = null,
        int? AniosAntiguedad = null,
        bool EsCaptacionPropia = true,
        decimal PorcentajeComision = 5.0m);

    public static void MapRegistrarPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/propiedades", async (Command command, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, IKpiWarmingService warmingService, CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();

            var propiedad = new Property
            {
                Id = Guid.NewGuid(),
                Titulo = command.Titulo,
                Descripcion = command.Descripcion,
                TipoPropiedad = command.TipoPropiedad,
                Operacion = command.Operacion,
                Precio = command.Precio,
                Direccion = command.Direccion,
                Sector = command.Sector,
                Ciudad = command.Ciudad,
                GoogleMapsUrl = command.GoogleMapsUrl,
                UrlRemax = command.UrlRemax,
                Habitaciones = command.Habitaciones,
                Banos = command.Banos,
                AreaTotal = command.AreaTotal,
                AreaTerreno = command.AreaTerreno,
                AreaConstruccion = command.AreaConstruccion,
                Estacionamientos = command.Estacionamientos,
                MediosBanos = command.MediosBanos,
                AniosAntiguedad = command.AniosAntiguedad,
                EstadoComercial = "Disponible",
                EsCaptacionPropia = command.EsCaptacionPropia,
                PorcentajeComision = command.PorcentajeComision,
                AgenteId = agenteId,
                FechaIngreso = DateTimeOffset.UtcNow
            };

            context.Properties.Add(propiedad);
            await context.SaveChangesAsync();

            // Notificar al servicio de Warming proactivamente
            warmingService.NotifyChange(agenteId);

            // Invalidar caches proactivamente
            await cacheStore.EvictByTagAsync("dashboard-data", ct);
            await cacheStore.EvictByTagAsync("analytics-data", ct);

            return Results.Created($"/propiedades/{propiedad.Id}", propiedad);
        })
        .WithTags("Propiedades")
        .WithName("RegistrarPropiedad");
    }
}
