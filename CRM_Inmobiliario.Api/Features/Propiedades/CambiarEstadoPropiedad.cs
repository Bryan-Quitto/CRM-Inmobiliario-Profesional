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
            var currentUserId = user.GetRequiredUserId();

            try
            {
                var ecuadorNow = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5));

                // Obtenemos la agencia del usuario actual para validar visibilidad multi-tenant
                var currentUserAgenciaId = await context.Agents
                    .AsNoTracking()
                    .Where(a => a.Id == currentUserId)
                    .Select(a => a.AgenciaId)
                    .FirstOrDefaultAsync(ct);

                // 1. LECTURAS
                var property = await context.Properties
                    .Include(p => p.Transactions.Where(t => t.TransactionStatus == "Active"))
                        .ThenInclude(t => t.CreatedBy)
                    .FirstOrDefaultAsync(p => p.Id == id && (p.AgenteId == currentUserId || (currentUserAgenciaId != null && p.AgenciaId == currentUserAgenciaId)), ct);

                if (property == null)
                {
                    logger.LogWarning("⚠️ [ESTADO] Propiedad {Id} no encontrada para el agente {AgenteId}", id, currentUserId);
                    return Results.NotFound(new { Message = "La propiedad no existe o no tiene permisos de visibilidad." });
                }

                // SEGURIDAD: Guardián de Estados (Multi-Agente)
                // Si la propiedad está en un estado que implica un proceso activo (Reservada, Vendida, Alquilada)
                // y el usuario actual no es ni el dueño de la captación ni el dueño de la transacción activa, rebotamos.
                var activeTransaction = property.Transactions.OrderByDescending(t => t.TransactionDate).FirstOrDefault(t => t.TransactionStatus == "Active");
                
                if (property.EstadoComercial is "Reservada" or "Vendida" or "Alquilada" && command.NuevoEstado is "Disponible" or "Inactiva")
                {
                    // Solo el autor de la transacción activa (o el dueño de la captación si no hay transacción) puede liberar el estado.
                    bool esAutorTransaccion = activeTransaction != null && activeTransaction.CreatedById == currentUserId;
                    bool esDuenioCaptacion = property.AgenteId == currentUserId;

                    if (!esAutorTransaccion && !esDuenioCaptacion)
                    {
                        var responsable = activeTransaction?.CreatedBy != null 
                            ? $"{activeTransaction.CreatedBy.Nombre} {activeTransaction.CreatedBy.Apellido}"
                            : "otro agente";

                        var msg = property.EstadoComercial switch
                        {
                            "Reservada" => $"Esta propiedad está en proceso por el agente {responsable}. Contáctese con el agente si desea hacer alguna modificación.",
                            _ => $"Esta propiedad ya fue {property.EstadoComercial.ToLower()} por el agente {responsable}. Contáctese con el agente si desea hacer alguna modificación."
                        };

                        return Results.Json(new { Message = msg }, statusCode: StatusCodes.Status400BadRequest);
                    }
                }

                // Spec 011: Validación de estado Reservada sobre Cierre
                if (command.NuevoEstado == "Reservada" && (property.EstadoComercial is "Vendida" or "Alquilada"))
                {
                    logger.LogWarning("⚠️ [ESTADO] Intento de reservar propiedad ya cerrada {Id}", id);
                    return Results.BadRequest(new { Message = "No puedes reservar una propiedad que ya está vendida o alquilada. Primero debes marcarla como Disponible." });
                }

                var esCierre = command.NuevoEstado is "Vendida" or "Alquilada";
                
                // Soporte para Alquileres Sucesivos Automáticos (Fase 5 item 3)
                bool esAlquilerSucesivo = property.EstadoComercial == "Alquilada" 
                                          && command.NuevoEstado == "Alquilada" 
                                          && command.CerradoConId.HasValue 
                                          && command.CerradoConId != property.CerradoConId;

                // Spec 011 Fase 5 item 3 & User Feedback:
                // Si la propiedad ya tiene un titular de cierre (CerradoConId) y se está registrando un NUEVO cierre
                // (sea el mismo Lead o uno distinto), debemos completar el ciclo anterior automáticamente.
                bool requiereRelistadoAutomatico = property.CerradoConId.HasValue && esCierre && !esAlquilerSucesivo;

                Domain.Entities.Lead? lead = null;

                if (esCierre && command.CerradoConId.HasValue)
                {
                    logger.LogInformation("👤 [ESTADO] Buscando Lead asociado: {LeadId}", command.CerradoConId.Value);
                    // El lead puede ser de la agencia (visibilidad compartida de prospectos si fuera el caso, 
                    // pero por ahora mantenemos que el lead debe ser del agente que cierra o compartido por agencia)
                    // Para mayor robustez, validamos que el lead sea del agente que cierra.
                    lead = await context.Leads
                        .FirstOrDefaultAsync(l => l.Id == command.CerradoConId.Value && l.AgenteId == currentUserId, ct);
                }
                
                if (requiereRelistadoAutomatico)
                {
                    logger.LogInformation("🔄 [ESTADO] Relistado automático detectado por transición entre estados de cierre.");
                    
                    // Finalizamos transacciones activas previas
                    foreach (var t in property.Transactions.Where(t => t.TransactionStatus == "Active"))
                    {
                        t.TransactionStatus = "Completed";
                    }

                    // Insertamos hito de relistado natural automático
                    context.PropertyTransactions.Add(new Domain.Entities.PropertyTransaction
                    {
                        Id = Guid.NewGuid(),
                        PropertyId = property.Id,
                        TransactionType = "Relisting",
                        TransactionStatus = "Completed",
                        TransactionDate = ecuadorNow.AddTicks(-1), // Un tick antes para orden cronológico
                        Notes = "Relistado automático por transición de estado comercial.",
                        CreatedById = currentUserId
                    });
                }
                else if (property.Transactions.Any(t => t.TransactionStatus == "Active"))
                {
                    foreach (var t in property.Transactions.Where(t => t.TransactionStatus == "Active"))
                    {
                        // Si es un cambio de estado comercial (de cierre a disponible/otro), marcamos como Completed
                        if (!esCierre || esAlquilerSucesivo)
                        {
                            t.TransactionStatus = "Completed";
                        }
                    }
                }

                // Si no es cierre y tenía un Lead vinculado, lo revertimos
                if (!esCierre && property.CerradoConId.HasValue)
                {
                    var leadToRevert = await context.Leads.FirstOrDefaultAsync(l => l.Id == property.CerradoConId.Value, ct);
                    if (leadToRevert != null)
                    {
                        leadToRevert.EtapaEmbudo = "En Negociación";
                        leadToRevert.FechaCierre = null;
                    }
                }

                property.EstadoComercial = command.NuevoEstado;
                property.FechaCierre = esCierre ? ecuadorNow : null;
                property.PrecioCierre = esCierre ? command.PrecioCierre : null;
                property.CerradoConId = esCierre ? command.CerradoConId : null;

                if (esCierre && lead != null)
                {
                    lead.EtapaEmbudo = "Cerrado";
                    lead.FechaCierre = ecuadorNow;

                    // Spec 011: Determinar tipo de transacción basado en el estado final alcanzado
                    var tipoTransaccion = command.NuevoEstado == "Alquilada" ? "Rent" : "Sale";

                    // Fase 1 Spec 011: Registrar la transacción para el historial inmobiliario
                    logger.LogInformation("📄 [ESTADO] Creando registro de transacción PropertyTransaction tipo {Tipo}...", tipoTransaccion);
                    context.PropertyTransactions.Add(new Domain.Entities.PropertyTransaction
                    {
                        Id = Guid.NewGuid(),
                        PropertyId = property.Id,
                        LeadId = lead.Id,
                        TransactionType = tipoTransaccion,
                        TransactionStatus = "Active", // Nueva transacción activa
                        Amount = command.PrecioCierre ?? property.Precio,
                        TransactionDate = ecuadorNow,
                        CreatedById = currentUserId,
                        Notes = esAlquilerSucesivo 
                            ? $"Alquiler sucesivo registrado. El inquilino anterior finalizó su ciclo."
                            : $"Cierre realizado desde el detalle de la propiedad. Marcada como {command.NuevoEstado}."
                    });

                    context.Interactions.Add(new Domain.Entities.Interaction
                    {
                        AgenteId = currentUserId,
                        ClienteId = lead.Id,
                        PropiedadId = property.Id,
                        TipoInteraccion = "Cierre",
                        Notas = $"Propiedad '{property.Titulo}' marcada como {command.NuevoEstado} por {command.PrecioCierre:C}."
                    });
                }

                // 3. GUARDADO TRANSACCIONAL AUTOMÁTICO
                logger.LogInformation("💾 [ESTADO] Ejecutando SaveChangesAsync...");
                await context.SaveChangesAsync(CancellationToken.None);
                
                // Notificar al servicio de Warming proactivamente
                warmingService.NotifyChange(currentUserId);

                // Invalidar caches proactivamente
                await cacheStore.EvictByTagAsync("dashboard-data", ct);
                await cacheStore.EvictByTagAsync("analytics-data", ct);
                await cacheStore.EvictByTagAsync("properties-data", ct);

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
