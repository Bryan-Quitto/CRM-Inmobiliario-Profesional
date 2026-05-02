using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
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
        Guid? CaptadorId = null,
        NuevoCaptadorRequest? NuevoCaptador = null,
        Guid? PropietarioId = null,
        decimal PorcentajeComision = 5.0m,
        DateTimeOffset? FechaIngreso = null);

    public record NuevoCaptadorRequest(string Nombre, string Apellido, string? Telefono);

    public static void MapActualizarPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPut("/propiedades/{id:guid}", async (Guid id, Command command, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, CancellationToken ct) =>
        {
            var currentUserId = user.GetRequiredUserId();

            var propiedad = await context.Properties
                .FirstOrDefaultAsync(p => p.Id == id, ct);

            if (propiedad is null)
            {
                return Results.NotFound();
            }

            // SEGURIDAD: Solo el dueño de la captación puede editar datos maestros
            if (propiedad.AgenteId != currentUserId)
            {
                return Results.Json(new { message = "Solo el agente que captó la propiedad puede editar sus datos maestros y galería." }, statusCode: StatusCodes.Status403Forbidden);
            }

            // Lógica de Captador
            Guid finalAgenteId = currentUserId;

            if (!command.EsCaptacionPropia)
            {
                if (command.CaptadorId.HasValue)
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
                        AgenciaId = propiedad.AgenciaId,
                        Rol = "Agente",
                        FechaCreacion = DateTimeOffset.UtcNow
                    };
                    context.Agents.Add(nuevoAgente);
                    finalAgenteId = nuevoAgente.Id;
                }
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
            propiedad.AgenteId = finalAgenteId; // Actualizamos el captador real

            // Manejo de Propietario (Spec 015 - Auto Promotion)
            if (command.PropietarioId.HasValue)
            {
                var propietario = await context.Contactos.FindAsync(command.PropietarioId.Value);
                if (propietario != null && !propietario.EsPropietario)
                {
                    propietario.EsPropietario = true;
                }
            }
            propiedad.PropietarioId = command.PropietarioId;
            
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
