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
    public record Command(string NuevaEtapa, Guid? PropiedadId = null, decimal? PrecioCierre = null, string? NuevoEstadoPropiedad = null, string Tipo = "prospecto");

    public static void MapCambiarEtapaClienteEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPatch("/clientes/{id:guid}/etapa", async (Guid id, Command command, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, IKpiWarmingService warmingService, ILogger<CrmDbContext> logger, CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();
            logger.LogInformation("[CierreDebug] Iniciando cambio de etapa para cliente {Id} a '{Etapa}' (Tipo: {Tipo}).", id, command.NuevaEtapa, command.Tipo);

            // Validación de estados por tipo
            if (command.Tipo == "propietario")
            {
                var estadosPropietario = new[] { "Activo", "Cerrado" };
                if (!estadosPropietario.Contains(command.NuevaEtapa))
                {
                    return Results.BadRequest(new { Message = $"Estado de propietario '{command.NuevaEtapa}' no es válido." });
                }
            }
            else
            {
                var etapasProspecto = new[] { "Nuevo", "Contactado", "Cita Programada", "En Negociación", "Cerrado", "Perdido" };
                if (!etapasProspecto.Contains(command.NuevaEtapa))
                {
                    return Results.BadRequest(new { Message = $"Etapa de prospecto '{command.NuevaEtapa}' no es válida." });
                }
            }

            // Buscar cliente
            var cliente = await context.Leads
                .FirstOrDefaultAsync(l => l.Id == id && l.AgenteId == agenteId, ct);

            if (cliente == null)
            {
                return Results.NotFound(new { Message = $"No se encontró el contacto o no te pertenece." });
            }

            // Aplicar cambio según tipo
            if (command.Tipo == "propietario")
            {
                cliente.EstadoPropietario = command.NuevaEtapa;
            }
            else
            {
                cliente.EtapaEmbudo = command.NuevaEtapa;

                // Gestión de FechaCierre para Analítica (Solo para Prospectos)
                if (command.NuevaEtapa == "Cerrado")
                {
                    cliente.FechaCierre = DateTimeOffset.UtcNow;
                    
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

                if (command.NuevaEtapa == "Cita Programada")
                {
                    var visitaEvent = new TaskItem
                    {
                        Id = Guid.NewGuid(),
                        AgenteId = agenteId,
                        ClienteId = id,
                        Titulo = $"Visita Programada: {cliente.Nombre} {cliente.Apellido}",
                        TipoTarea = "Visita",
                        FechaInicio = DateTimeOffset.UtcNow.AddDays(1).Date.AddHours(10),
                        DuracionMinutos = 60,
                        ColorHex = "#10b981",
                        Estado = "Pendiente"
                    };
                    context.Tasks.Add(visitaEvent);
                }
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
