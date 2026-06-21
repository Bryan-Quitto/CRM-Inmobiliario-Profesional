using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.OutputCaching;
using CRM_Inmobiliario.Api.Features.Dashboard;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class VolverAListarPropiedadFeature
{
    public record Request(string? Notas, string Mode = "Relist"); // "Relist" (Natural) o "Cancel" (Trato Caído)

    public static RouteHandlerBuilder MapVolverAListarPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapPost("/propiedades/{id:guid}/relist", async (Guid id, Request? request, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, IKpiWarmingService warmingService, ILogger<CrmDbContext> logger, CancellationToken ct) =>
        {
            logger.LogInformation("[RELIST] Iniciando relistado para propiedad {Id}, Mode: {Mode}", id, request?.Mode ?? "Relist");
            
            var agenteId = user.GetRequiredUserId();
            var ecuadorNow = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5));
            var mode = request?.Mode ?? "Relist";

            // Obtenemos la agencia del agente actual para validación multi-tenant
            var agenciaId = await context.Agents
                .AsNoTracking()
                .Where(a => a.Id == agenteId)
                .Select(a => a.AgenciaId)
                .FirstOrDefaultAsync(ct);
            
            logger.LogInformation("[RELIST] AgenteId: {AgenteId}, AgenciaId: {AgenciaId}", agenteId, agenciaId);

            // Cargamos la propiedad para validar y actualizar
            var propiedad = await context.Properties
                .Include(p => p.Transactions.Where(t => t.TransactionStatus == "Active"))
                .FirstOrDefaultAsync(p => p.Id == id && (
                    p.AgenteId == agenteId || 
                    p.CreatedByAgenteId == agenteId || 
                    (agenciaId != null && p.AgenciaId == agenciaId) ||
                    p.Transactions.Any(t => t.CreatedById == agenteId)
                ), ct);

            if (propiedad is null)
            {
                logger.LogWarning("[RELIST] Propiedad {Id} no encontrada o acceso denegado", id);
                return Results.NotFound();
            }

            logger.LogInformation("[RELIST] Propiedad encontrada: {Titulo}, PropietarioId: {PropietarioId}, CerradoConId: {CerradoConId}", propiedad.Titulo, propiedad.PropietarioId, propiedad.CerradoConId);

            // Identificamos la transacción de cierre o reserva activa (Sale, Rent o Reservation)
            var transaccionActiva = propiedad.Transactions
                .FirstOrDefault(t => t.TransactionType == "Sale" || t.TransactionType == "Rent" || t.TransactionType == "Reservation");

            if (mode == "Cancel")
            {
                logger.LogInformation("[RELIST] Modo CANCEL: Anulando operación");
                // Acción B: Cancelación de Trato (Trato Caído)
                if (propiedad.CerradoConId.HasValue)
                {
                    var contactoToRevert = await context.Contactos.FirstOrDefaultAsync(l => l.Id == propiedad.CerradoConId.Value, ct);
                    if (contactoToRevert != null)
                    {
                        bool tieneOtrasCerradas = await context.Properties.AnyAsync(p => 
                            p.CerradoConId == contactoToRevert.Id && 
                            p.Id != id && 
                            (p.EstadoComercial == "Vendida" || p.EstadoComercial == "Alquilada"), ct);

                        if (tieneOtrasCerradas)
                        {
                            logger.LogInformation("[RELIST] Contacto {ContactoId} retiene estado de Cerrado por otras propiedades cerradas.", contactoToRevert.Id);
                        }
                        else
                        {
                            bool tieneOtrasReservadas = await context.Properties.AnyAsync(p => 
                                p.CerradoConId == contactoToRevert.Id && 
                                p.Id != id && 
                                p.EstadoComercial == "Reservada", ct);

                            if (tieneOtrasReservadas)
                            {
                                logger.LogInformation("[RELIST] Contacto {ContactoId} baja a En Negociación por otras reservas activas.", contactoToRevert.Id);
                                contactoToRevert.EtapaEmbudo = "En Negociación";
                                contactoToRevert.FechaCierre = null;
                            }
                            else
                            {
                                logger.LogInformation("[RELIST] Revirtiendo contacto {ContactoId} a Contactado", contactoToRevert.Id);
                                contactoToRevert.EtapaEmbudo = "Contactado"; // Reversión automática
                                contactoToRevert.FechaCierre = null;
                            }
                        }
                    }
                }

                if (transaccionActiva != null)
                {
                    logger.LogInformation("[RELIST] Marcando transacción {TransId} como Cancelled", transaccionActiva.Id);
                    transaccionActiva.TransactionStatus = "Cancelled"; // Prohibido borrado físico
                }

                // Registramos la transacción de cancelación para el historial
                context.PropertyTransactions.Add(new PropertyTransaction
                {
                    Id = Guid.NewGuid(),
                    PropertyId = id,
                    ContactoId = propiedad.CerradoConId,
                    TransactionType = "Cancellation",
                    TransactionStatus = "Completed",
                    TransactionDate = ecuadorNow,
                    Notes = request?.Notas ?? "Trato caído. Operación anulada.",
                    CreatedById = agenteId
                });

                if (propiedad.CerradoConId.HasValue)
                {
                    context.Interactions.Add(new Interaction
                    {
                        Id = Guid.NewGuid(),
                        AgenteId = agenteId,
                        ContactoId = propiedad.CerradoConId.Value,
                        PropiedadId = id,
                        TipoInteraccion = "Cancelación",
                        Notas = request?.Notas ?? $"Trato caído desde la propiedad. Operación anulada para '{propiedad.Titulo}'.",
                        FechaInteraccion = ecuadorNow
                    });
                }
            }
            else
            {
                logger.LogInformation("[RELIST] Modo RELIST: Fin de ciclo natural");
                // Acción A: Relistado Natural (Fin de Ciclo)
                if (transaccionActiva != null)
                {
                    logger.LogInformation("[RELIST] Marcando transacción {TransId} como Completed", transaccionActiva.Id);
                    transaccionActiva.TransactionStatus = "Completed";
                }

                // Registramos la transacción de relistado
                context.PropertyTransactions.Add(new PropertyTransaction
                {
                    Id = Guid.NewGuid(),
                    PropertyId = id,
                    TransactionType = "Relisting",
                    TransactionStatus = "Completed",
                    TransactionDate = ecuadorNow,
                    Notes = request?.Notas ?? "Fin de ciclo comercial. Propiedad relistada.",
                    CreatedById = agenteId
                });

                if (propiedad.CerradoConId.HasValue)
                {
                    context.Interactions.Add(new Interaction
                    {
                        Id = Guid.NewGuid(),
                        AgenteId = agenteId,
                        ContactoId = propiedad.CerradoConId.Value,
                        PropiedadId = id,
                        TipoInteraccion = "Sistema",
                        Notas = request?.Notas ?? $"Fin de ciclo comercial desde la propiedad. Contrato de '{propiedad.Titulo}' finalizado.",
                        FechaInteraccion = ecuadorNow
                    });
                }
                
                // Nota: El Contacto permanece en su estado actual (Cerrado) según Spec
            }

            // Reactivamos al propietario si corresponde y definimos el estado final de la propiedad
            var estadoFinalPropiedad = "Disponible";

            if (propiedad.PropietarioId.HasValue)
            {
                logger.LogInformation("[RELIST] Verificando estado del propietario {PropietarioId}", propiedad.PropietarioId);
                var propietario = await context.Contactos.FindAsync(propiedad.PropietarioId.Value);
                if (propietario != null)
                {
                    logger.LogInformation("[RELIST] EstadoPropietario actual: {Estado}", propietario.EstadoPropietario);
                    if (propietario.EstadoPropietario == "Inactivo")
                    {
                        estadoFinalPropiedad = "Inactiva";
                    }
                    else if (propietario.EstadoPropietario == "Cerrado")
                    {
                        propietario.EstadoPropietario = "Activo";
                        context.Entry(propietario).State = EntityState.Modified;
                    }
                    else if (propietario.EstadoPropietario != "Activo")
                    {
                        propietario.EstadoPropietario = "Activo";
                        context.Entry(propietario).State = EntityState.Modified;
                    }
                }
            }

            // Actualizamos estado de la propiedad
            propiedad.EstadoComercial = estadoFinalPropiedad;
            propiedad.CerradoConId = null;
            propiedad.FechaCierre = null;
            propiedad.PrecioCierre = null;

            logger.LogInformation("[RELIST] Guardando cambios. Estado final: {Estado}", estadoFinalPropiedad);

            try
            {
                await context.SaveChangesAsync(ct);
                await context.UpsertAgentPropertyActivityAsync(user.GetRequiredUserId(), id, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), ct);
                
                logger.LogInformation("[RELIST] Éxito: Cambios guardados en DB");

                // Invalidar caches e informar al warming service
                warmingService.NotifyChange(agenteId);
                await cacheStore.EvictByTagAsync("dashboard-data", ct);
                await cacheStore.EvictByTagAsync("analytics-data", ct);
                await cacheStore.EvictByTagAsync("properties-data", ct);

                return Results.Ok(new { Message = mode == "Cancel" ? "Operación cancelada con éxito" : "Propiedad relistada con éxito" });
            }
            catch (DbUpdateConcurrencyException)
            {
                logger.LogError("[RELIST] Error de concurrencia al relistar propiedad {Id}", id);
                return Results.Conflict(new { Message = "La propiedad fue modificada por otro usuario al mismo tiempo. Por favor, refresca la página e intenta de nuevo." });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "[RELIST] ERROR CRÍTICO al relistar propiedad {Id}", id);
                throw;
            }
        })
        .WithTags("Propiedades")
        .WithName("VolverAListarPropiedad");
    }
}

