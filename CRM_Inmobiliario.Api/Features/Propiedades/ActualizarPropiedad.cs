using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.OutputCaching;
using Hangfire;
using CRM_Inmobiliario.Api.Features.Propiedades.Jobs;

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
        bool EsCaptadorActivo = true,
        Guid? CaptadorId = null,
        NuevoCaptadorRequest? NuevoCaptador = null,
        Guid? PropietarioId = null,
        decimal PorcentajeComision = 5.0m,
        DateTimeOffset? FechaIngreso = null,
        uint? Version = null);

    public record NuevoCaptadorRequest(string Nombre, string Apellido, string? Telefono);

    public static void MapActualizarPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPut("/propiedades/{id:guid}", async (Guid id, Command command, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, IBackgroundJobClient backgroundJobs, ILogger<CrmDbContext> logger, CancellationToken ct) =>
        {
            logger.LogInformation("ActualizarPropiedad {Id}: Inicio del request", id);
            var currentUserId = user.GetRequiredUserId();

            var propiedad = await context.Properties
                .Include(p => p.Agente)
                .Include(p => p.Transactions)
                .FirstOrDefaultAsync(p => p.Id == id, ct);

            if (propiedad is null)
            {
                logger.LogWarning("ActualizarPropiedad {Id}: Propiedad no encontrada", id);
                return Results.NotFound();
            }

            // SEGURIDAD: Validación por Agente Activo (Spec 015 Custom)
            var isArchived = await context.AgentArchivedProperties.AnyAsync(a => a.AgentId == currentUserId && a.PropiedadId == id, ct);
            if (isArchived)
            {
                return Results.BadRequest(new { message = "No puedes modificar un registro archivado" });
            }
            if (!PropertyPermissionsHelper.CanManage(propiedad, currentUserId, false))
            {
                return Results.Json(new { message = "No tienes permisos para editar esta propiedad. Contacta al agente responsable." }, statusCode: StatusCodes.Status403Forbidden);
            }

            // Lógica de Captador
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
                    Telefono = command.NuevoCaptador.Telefono.NormalizePhoneE164() ?? command.NuevoCaptador.Telefono,
                    Email = $"invitado_{Guid.NewGuid().ToString()[..8]}@crm-inmobiliario.com",
                    Activo = false,
                    AgenciaId = propiedad.AgenciaId,
                    CreatedById = currentUserId,
                    Rol = "Agente",
                    FechaCreacion = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5))
                };
                context.Agents.Add(nuevoAgente);
                finalAgenteId = nuevoAgente.Id;
            }
            
            // Fallback: Si sigue siendo null, mantenemos el que tenía o asignamos al creador
            finalAgenteId ??= propiedad.AgenteId ?? propiedad.CreatedByAgenteId ?? currentUserId;

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
            propiedad.EsCaptadorActivo = command.EsCaptadorActivo;
            propiedad.PorcentajeComision = command.PorcentajeComision;
            propiedad.AgenteId = finalAgenteId; // Actualizamos el captador real

            var oldPropietarioId = propiedad.PropietarioId;

            // Manejo de Propietario (Spec 015 - Auto Promotion)
            if (command.PropietarioId.HasValue && oldPropietarioId != command.PropietarioId)
            {
                var propietario = await context.Contactos.FindAsync(command.PropietarioId.Value);
                if (propietario != null)
                {
                    if (!propietario.EsPropietario)
                    {
                        propietario.EsPropietario = true;
                    }
                    if (propiedad.EstadoComercial != "Vendida" && propiedad.EstadoComercial != "Alquilada" && propiedad.EstadoComercial != "Inactiva")
                    {
                        propietario.EstadoPropietario = "Activo";
                    }
                    propietario.NumeroPropiedadesCaptadas++;
                }
            }
            propiedad.PropietarioId = command.PropietarioId;
            
            if (command.FechaIngreso.HasValue)
            {
                propiedad.FechaIngreso = command.FechaIngreso.Value;
            }

            if (command.Version.HasValue)
            {
                context.Entry(propiedad).Property(p => p.Version).OriginalValue = command.Version.Value;
            }

            // Invalidar vectores anteriores para forzar su regeneración en el job
            propiedad.VectorEmbedding = null;
            propiedad.GeminiEmbedding = null;

            try
            {
                logger.LogInformation("ActualizarPropiedad {Id}: Iniciando SaveChangesAsync", id);
                await context.SaveChangesAsync(ct);
                await context.UpsertAgentPropertyActivityAsync(currentUserId, id, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), ct);
                logger.LogInformation("ActualizarPropiedad {Id}: SaveChangesAsync exitoso", id);
                
                // Enqueue background job to update vector embedding
                logger.LogInformation("ActualizarPropiedad {Id}: Encolando job de embedding", id);
                backgroundJobs.Enqueue<PropertyEmbeddingJob>(j => j.ProcessPropertyAsync(propiedad.Id));

                // Demote old owner if they no longer have properties
                if (oldPropietarioId.HasValue && oldPropietarioId != command.PropietarioId)
                {
                    logger.LogInformation("ActualizarPropiedad {Id}: Demoteando antiguo propietario {PropietarioId}", id, oldPropietarioId);
                    var oldPropietario = await context.Contactos.FindAsync(oldPropietarioId.Value);
                    if (oldPropietario != null)
                    {
                        oldPropietario.NumeroPropiedadesCaptadas = Math.Max(0, oldPropietario.NumeroPropiedadesCaptadas - 1);
                        var tienePropiedades = await context.Properties.AnyAsync(p => p.PropietarioId == oldPropietarioId);
                        if (!tienePropiedades)
                        {
                            oldPropietario.EsPropietario = false;
                        }
                        await context.SaveChangesAsync();
                    }
                }
            }
            catch (DbUpdateConcurrencyException)
            {
                return Results.Conflict(new { Message = "Los datos de la propiedad están desactualizados. Por favor, refresca la página para cargar la última versión." });
            }

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
