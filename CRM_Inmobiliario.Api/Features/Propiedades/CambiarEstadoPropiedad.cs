using System;
using System.Security.Claims;
using System.Threading;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Features.Dashboard;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.OutputCaching;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class CambiarEstadoPropiedadFeature
{
    public record Command(string NuevoEstado, decimal? PrecioCierre = null, Guid? CerradoConId = null);

    public static void MapCambiarEstadoPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPatch("/propiedades/{id:guid}/estado", async (
            Guid id, 
            Command command, 
            ClaimsPrincipal user, 
            CrmDbContext context,
            ILoggerFactory loggerFactory,
            IOutputCacheStore cacheStore,
            IKpiWarmingService warmingService,
            CancellationToken ct) =>
        {
            var logger = loggerFactory.CreateLogger("CambiarEstadoPropiedad");
            var agenteId = user.GetRequiredUserId();

            try
            {
                // 1. LECTURAS
                var property = await context.Properties
                    .FirstOrDefaultAsync(p => p.Id == id && p.AgenteId == agenteId, ct);

                if (property == null)
                {
                    logger.LogWarning("⚠️ [ESTADO] Propiedad {Id} no encontrada para el agente {AgenteId}", id, agenteId);
                    return Results.NotFound(new { Message = "La propiedad no existe o no tiene permisos." });
                }

                var esCierre = command.NuevoEstado is "Vendida" or "Alquilada";
                Domain.Entities.Lead? lead = null;

                if (esCierre && command.CerradoConId.HasValue)
                {
                    logger.LogInformation("👤 [ESTADO] Buscando Lead asociado: {LeadId}", command.CerradoConId.Value);
                    lead = await context.Leads
                        .FirstOrDefaultAsync(l => l.Id == command.CerradoConId.Value && l.AgenteId == agenteId, ct);

                    if (lead == null)
                    {
                        logger.LogWarning("⚠️ [ESTADO] Lead {LeadId} no encontrado", command.CerradoConId.Value);
                    }
                }
                
                // 2. MODIFICACIONES EN MEMORIA
                logger.LogInformation("📝 [ESTADO] Actualizando campos de la propiedad...");
                property.EstadoComercial = command.NuevoEstado;
                property.FechaCierre = esCierre ? DateTimeOffset.UtcNow : null;
                property.PrecioCierre = esCierre ? command.PrecioCierre : null;
                property.CerradoConId = esCierre ? command.CerradoConId : null;

                if (esCierre && lead != null)
                {
                    lead.EtapaEmbudo = "Cerrado";
                    lead.FechaCierre = DateTimeOffset.UtcNow;

                    var operacion = property.Operacion is "Alquiler" ? "Alquiler" : "Venta";
                    context.Interactions.Add(new Domain.Entities.Interaction
                    {
                        AgenteId = agenteId,
                        ClienteId = lead.Id,
                        PropiedadId = property.Id,
                        TipoInteraccion = "Cierre",
                        Notas = $"Propiedad '{property.Titulo}' marcada como {command.NuevoEstado} por {command.PrecioCierre:C}."
                    });
                }

                // 3. GUARDADO TRANSACCIONAL AUTOMÁTICO
                // Usamos CancellationToken.None para que un cierre de navegador no aborte el guardado a la mitad
                logger.LogInformation("💾 [ESTADO] Ejecutando SaveChangesAsync...");
                await context.SaveChangesAsync(CancellationToken.None);
                
                // Notificar al servicio de Warming proactivamente
                warmingService.NotifyChange(agenteId);

                // Invalidar caches proactivamente
                await cacheStore.EvictByTagAsync("dashboard-data", ct);
                await cacheStore.EvictByTagAsync("analytics-data", ct);

                logger.LogInformation("🏁 [ESTADO] Proceso completado exitosamente para {Id}", id);
                return Results.NoContent();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "❌ [ESTADO] ERROR crítico al procesar el cambio de estado para la propiedad {Id}", id);
                return Results.Problem($"Error al procesar el cambio de estado: {ex.Message}");
            }
        })
        .WithTags("Propiedades")
        .WithName("CambiarEstadoPropiedad");
    }
}
