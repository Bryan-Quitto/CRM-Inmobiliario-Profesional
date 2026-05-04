using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Features.Dashboard;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.EntityFrameworkCore;

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
        Guid? CaptadorId = null,
        NuevoCaptadorRequest? NuevoCaptador = null,
        Guid? PropietarioId = null,
        decimal PorcentajeComision = 5.0m,
        DateTimeOffset? FechaIngreso = null);

    public record NuevoCaptadorRequest(string Nombre, string Apellido, string? Telefono);

    public static void MapRegistrarPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/propiedades", async (Command command, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, IKpiWarmingService warmingService, CancellationToken ct) =>
        {
            var currentUserId = user.GetRequiredUserId();
            var currentAgent = await context.Agents
                .AsNoTracking()
                .Where(a => a.Id == currentUserId)
                .Select(a => new { a.AgenciaId })
                .FirstOrDefaultAsync(ct);

            Guid? finalAgenteId = null;

            if (command.EsCaptacionPropia)
            {
                finalAgenteId = currentUserId;
            }
            else if (command.CaptadorId.HasValue)
            {
                finalAgenteId = command.CaptadorId.Value;
            }
            else if (command.NuevoCaptador != null)
            {
                // Crear agente "invitado" (inactivo)
                var nuevoAgente = new Agent
                {
                    Id = Guid.NewGuid(),
                    Nombre = command.NuevoCaptador.Nombre,
                    Apellido = command.NuevoCaptador.Apellido,
                    Telefono = command.NuevoCaptador.Telefono,
                    Email = $"invitado_{Guid.NewGuid().ToString()[..8]}@crm-inmobiliario.com",
                    Activo = false,
                    AgenciaId = currentAgent?.AgenciaId,
                    CreatedById = currentUserId,
                    Rol = "Agente",
                    FechaCreacion = DateTimeOffset.UtcNow
                };
                context.Agents.Add(nuevoAgente);
                finalAgenteId = nuevoAgente.Id;
            }
            // Si es null, se considera Agente Anónimo

            // Manejo de Propietario (Spec 015)
            if (command.PropietarioId.HasValue)
            {
                var propietario = await context.Contactos.FindAsync(command.PropietarioId.Value);
                if (propietario != null)
                {
                    propietario.EsPropietario = true;
                    // Fix Prueba 4: Si se le asigna una nueva propiedad, debe pasar a Activo
                    propietario.EstadoPropietario = "Activo";
                }
            }

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
                AgenteId = finalAgenteId,
                CreatedByAgenteId = currentUserId,
                AgenciaId = currentAgent?.AgenciaId,
                PropietarioId = command.PropietarioId,
                FechaIngreso = command.FechaIngreso ?? DateTimeOffset.UtcNow
            };

            context.Properties.Add(propiedad);
            await context.SaveChangesAsync();

            // Notificar al servicio de Warming proactivamente para el agente que registra
            warmingService.NotifyChange(currentUserId);

            // Invalidar caches proactivamente
            await cacheStore.EvictByTagAsync("dashboard-data", ct);
            await cacheStore.EvictByTagAsync("analytics-data", ct);
            await cacheStore.EvictByTagAsync("properties-data", ct);

            return Results.Created($"/propiedades/{propiedad.Id}", propiedad);
        })
        .WithTags("Propiedades")
        .WithName("RegistrarPropiedad");
    }
}
