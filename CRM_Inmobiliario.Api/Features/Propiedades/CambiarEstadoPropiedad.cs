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

                // Spec 011: Validación de estado Reservada sobre Cierre
                if (command.NuevoEstado == "Reservada" && (property.EstadoComercial is "Vendida" or "Alquilada"))
                {
                    logger.LogWarning("⚠️ [ESTADO] Intento de reservar propiedad ya cerrada {Id}", id);
                    return Results.BadRequest(new { Message = "No puedes reservar una propiedad que ya está vendida o alquilada. Primero debes eliminar el registro de cierre en el historial." });
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
                
                // Spec 011: Si la propiedad estaba cerrada y ahora cambia a un estado disponible/inactivo, revertir el Lead y limpiar transacciones
                if (!esCierre && property.CerradoConId.HasValue)
                {
                    logger.LogInformation("🔄 [ESTADO] Revirtiendo cierre de propiedad {Id}. Limpiando Lead y Transacciones.", id);
                    
                    // 1. Revertir Lead
                    var leadToRevert = await context.Leads.FirstOrDefaultAsync(l => l.Id == property.CerradoConId.Value && l.AgenteId == agenteId, ct);
                    if (leadToRevert != null)
                    {
                        leadToRevert.EtapaEmbudo = "En Negociación";
                        leadToRevert.FechaCierre = null;
                    }

                    // 2. Eliminar la transacción de cierre (Sale/Rent) asociada
                    var transaccionesCierre = await context.PropertyTransactions
                        .Where(t => t.PropertyId == id && t.LeadId == property.CerradoConId.Value && (t.TransactionType == "Sale" || t.TransactionType == "Rent"))
                        .ToListAsync(ct);
                    
                    if (transaccionesCierre.Any())
                    {
                        logger.LogInformation("🗑️ [ESTADO] Eliminando {Count} transacciones de cierre asociadas.", transaccionesCierre.Count);
                        context.PropertyTransactions.RemoveRange(transaccionesCierre);
                    }
                }

                property.EstadoComercial = command.NuevoEstado;
                property.FechaCierre = esCierre ? DateTimeOffset.UtcNow : null;
                property.PrecioCierre = esCierre ? command.PrecioCierre : null;
                property.CerradoConId = esCierre ? command.CerradoConId : null;

                if (esCierre && lead != null)
                {
                    lead.EtapaEmbudo = "Cerrado";
                    lead.FechaCierre = DateTimeOffset.UtcNow;

                    var operacion = property.Operacion is "Alquiler" ? "Alquiler" : "Venta";

                    // Fase 1 Spec 011: Registrar la transacción para el historial inmobiliario
                    logger.LogInformation("📄 [ESTADO] Creando registro de transacción PropertyTransaction...");
                    context.PropertyTransactions.Add(new Domain.Entities.PropertyTransaction
                    {
                        Id = Guid.NewGuid(),
                        PropertyId = property.Id,
                        LeadId = lead.Id,
                        TransactionType = operacion == "Alquiler" ? "Rent" : "Sale",
                        Amount = command.PrecioCierre ?? property.Precio,
                        TransactionDate = DateTimeOffset.UtcNow,
                        CreatedById = agenteId,
                        Notes = $"Cierre realizado desde el detalle de la propiedad. Marcada como {command.NuevoEstado}."
                    });

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
