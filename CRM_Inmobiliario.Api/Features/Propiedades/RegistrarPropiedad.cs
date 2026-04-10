using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
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
        int Habitaciones,
        decimal Banos,
        decimal AreaTotal,
        bool EsCaptacionPropia = true,
        decimal PorcentajeComision = 5.0m);

    public static void MapRegistrarPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/propiedades", async (Command command, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, CancellationToken ct) =>
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
                Habitaciones = command.Habitaciones,
                Banos = command.Banos,
                AreaTotal = command.AreaTotal,
                EstadoComercial = "Disponible",
                EsCaptacionPropia = command.EsCaptacionPropia,
                PorcentajeComision = command.PorcentajeComision,
                AgenteId = agenteId,
                FechaIngreso = DateTimeOffset.UtcNow
            };

            context.Properties.Add(propiedad);
            await context.SaveChangesAsync();

            // Invalidar caches proactivamente
            await cacheStore.EvictByTagAsync("dashboard-data", ct);
            await cacheStore.EvictByTagAsync("analytics-data", ct);

            return Results.Created($"/propiedades/{propiedad.Id}", propiedad);
        })
        .WithTags("Propiedades")
        .WithName("RegistrarPropiedad");
    }
}
