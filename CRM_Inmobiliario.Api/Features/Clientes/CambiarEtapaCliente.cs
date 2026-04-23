using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Features.Dashboard;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.OutputCaching;

namespace CRM_Inmobiliario.Api.Features.Clientes;

public static class CambiarEtapaClienteFeature
{
    public record Command(string NuevaEtapa, Guid? PropiedadId = null, decimal? PrecioCierre = null, string? NuevoEstadoPropiedad = null);

    public static void MapCambiarEtapaClienteEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPatch("/clientes/{id:guid}/etapa", async (Guid id, Command command, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, IKpiWarmingService warmingService, ILogger<CrmDbContext> logger, CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();
            logger.LogInformation("[CierreDebug] Iniciando cambio de etapa para cliente {Id} a '{Etapa}'. Propiedad: {PropId}, Precio: {Precio}", id, command.NuevaEtapa, command.PropiedadId, command.PrecioCierre);

            // Validación básica de etapa permitida (Evolución: Cita Programada añadida)
            var etapasPermitidas = new[] { "Nuevo", "Contactado", "Cita Programada", "En Negociación", "Cerrado", "Perdido" };
            if (!etapasPermitidas.Contains(command.NuevaEtapa))
            {
                logger.LogWarning("[CierreDebug] Etapa '{Etapa}' no es válida.", command.NuevaEtapa);
                return Results.BadRequest(new { Message = $"La etapa '{command.NuevaEtapa}' no es válida." });
            }

            // Buscar cliente para verificar propiedad y obtener datos para la tarea
            var cliente = await context.Leads
                .FirstOrDefaultAsync(l => l.Id == id && l.AgenteId == agenteId, ct);

            if (cliente == null)
            {
                logger.LogWarning("[CierreDebug] Cliente {Id} no encontrado o no pertenece al agente {AgenteId}", id, agenteId);
                return Results.NotFound(new { Message = $"No se encontró el prospecto o no te pertenece." });
            }

            // Actualizar etapa
            cliente.EtapaEmbudo = command.NuevaEtapa;

            // Gestión de FechaCierre para Analítica
            if (command.NuevaEtapa == "Cerrado")
            {
                cliente.FechaCierre = DateTimeOffset.UtcNow;
                logger.LogInformation("[CierreDebug] Etapa marcada como 'Cerrado'. Procesando lógica de propiedad...");

                // SI SE PROVEE UNA PROPIEDAD PARA CERRAR
                if (command.PropiedadId.HasValue)
                {
                    var property = await context.Properties
                        .FirstOrDefaultAsync(p => p.Id == command.PropiedadId.Value && p.AgenteId == agenteId, ct);

                    if (property != null)
                    {
                        var estado = command.NuevoEstadoPropiedad ?? (property.Operacion == "Alquiler" ? "Alquilada" : "Vendida");
                        property.EstadoComercial = estado;
                        property.FechaCierre = DateTimeOffset.UtcNow;
                        property.PrecioCierre = command.PrecioCierre;
                        property.CerradoConId = id;

                        logger.LogInformation("[CierreDebug] Propiedad encontrada: '{Titulo}'. Estado final: {Estado}", property.Titulo, estado);

                        // Fase 1 Spec 011: Registrar la transacción para el historial inmobiliario
                        var transaccion = new PropertyTransaction
                        {
                            Id = Guid.NewGuid(),
                            PropertyId = property.Id,
                            LeadId = id,
                            TransactionType = property.Operacion == "Alquiler" ? "Rent" : "Sale",
                            Amount = command.PrecioCierre ?? property.Precio,
                            TransactionDate = DateTimeOffset.UtcNow,
                            CreatedById = agenteId,
                            Notes = $"Cierre realizado desde el perfil del cliente. Propiedad '{property.Titulo}' marcada como {estado}."
                        };
                        
                        context.PropertyTransactions.Add(transaccion);
                        logger.LogInformation("[CierreDebug] Transacción de {Tipo} añadida al contexto por {Monto}", transaccion.TransactionType, transaccion.Amount);

                        context.Interactions.Add(new Interaction
                        {
                            AgenteId = agenteId,
                            ClienteId = id,
                            PropiedadId = property.Id,
                            TipoInteraccion = "Cierre",
                            Notas = $"Cierre realizado desde el perfil del cliente. Propiedad '{property.Titulo}' marcada como {estado} por {command.PrecioCierre:C}."
                        });
                    }
                }
            }
            else
            {
                cliente.FechaCierre = null;
            }

            // Sincronización Automática: Generar evento de calendario si es Cita Programada
            if (command.NuevaEtapa == "Cita Programada")
            {
                var visitaEvent = new TaskItem
                {
                    Id = Guid.NewGuid(),
                    AgenteId = agenteId,
                    ClienteId = id,
                    Titulo = $"Visita Programada: {cliente.Nombre} {cliente.Apellido}",
                    TipoTarea = "Visita",
                    FechaInicio = DateTimeOffset.UtcNow.AddDays(1).Date.AddHours(10), // Mañana 10:00 AM UTC default
                    DuracionMinutos = 60,
                    ColorHex = "#10b981", // Emerald-500
                    Estado = "Pendiente"
                };
                context.Tasks.Add(visitaEvent);
            }

            await context.SaveChangesAsync();

            // Notificar al servicio de Warming proactivamente
            warmingService.NotifyChange(agenteId);

            // Invalidar caches proactivamente
            await cacheStore.EvictByTagAsync("dashboard-data", ct);
            await cacheStore.EvictByTagAsync("analytics-data", ct);

            return Results.NoContent();
        })
        .WithTags("Clientes")
        .WithName("CambiarEtapaCliente");
    }
}
