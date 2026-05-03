using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Features.Dashboard;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Contactos;

public static class CambiarEtapaContactoFeature
{
    public record Command(string NuevaEtapa, string Tipo, decimal? PrecioCierre = null);

    public static void MapCambiarEtapaContactoEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPatch("/contactos/{id:guid}/etapa", async (Guid id, Command command, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, IKpiWarmingService warmingService, ILogger<CrmDbContext> logger, CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();
            var esTipoPropietario = string.Equals(command.Tipo, "Propietario", StringComparison.OrdinalIgnoreCase);
            
            logger.LogInformation("[CierreDebug] Iniciando cambio de etapa para contacto {Id} a '{Etapa}' (Tipo: {Tipo}).", id, command.NuevaEtapa, command.Tipo);

            // 1. Validar que la nueva etapa sea válida para el tipo
            var etapasValidas = esTipoPropietario
                ? new[] { "Activo", "Inactivo", "Vendido", "Rentado", "Retirado", "Cerrado" }
                : new[] { "Nuevo", "Contactado", "Cita", "En Negociación", "Negociación", "Cerrado", "Cerrado Ganado", "Perdido", "Cerrado Perdido" };

            if (!etapasValidas.Contains(command.NuevaEtapa))
            {
                return Results.BadRequest(new { Message = $"Etapa '{command.NuevaEtapa}' no válida para el tipo '{command.Tipo}'." });
            }

            // Buscar contacto y actualizar etapa
            try
            {
                // Buscar contacto
                var contacto = await context.Contactos
                    .FirstOrDefaultAsync(l => l.Id == id && l.AgenteId == agenteId, ct);

                if (contacto == null)
                {
                    return Results.NotFound();
                }

                // Actualizar etapa según el tipo
                if (esTipoPropietario)
                {
                    contacto.EstadoPropietario = command.NuevaEtapa;
                }
                else
                {
                    contacto.EtapaEmbudo = command.NuevaEtapa;
                }

                // Lógica especial para cierres (Cerrado Ganado / Vendido / Rentado / Cerrado)
                var esCierreExitoso = new[] { "Cerrado", "Cerrado Ganado", "Vendido", "Rentado" }.Contains(command.NuevaEtapa);
                
                if (esCierreExitoso)
                {
                    contacto.FechaCierre = DateTimeOffset.UtcNow;

                    // Si se marca como Cerrado / Cerrado Ganado, buscar propiedades vinculadas
                    if (!esTipoPropietario && (command.NuevaEtapa == "Cerrado" || command.NuevaEtapa == "Cerrado Ganado"))
                    {
                        var propiedadesVinculadas = await context.ContactoInteresPropiedades
                            .Where(lpi => lpi.ContactoId == id)
                            .Select(lpi => lpi.Propiedad)
                            .ToListAsync(ct);

                        foreach (var property in propiedadesVinculadas)
                        {
                            if (property != null && property.EstadoComercial == "Disponible")
                            {
                                var estado = command.NuevaEtapa == "Rentado" ? "Alquilada" : "Vendida";
                                property.EstadoComercial = estado;

                                // Registrar transacción de cierre
                                var propTransaction = new PropertyTransaction
                                {
                                    Id = Guid.NewGuid(),
                                    PropertyId = property.Id,
                                    ContactoId = id,
                                    CreatedById = agenteId,
                                    TransactionType = command.NuevaEtapa == "Rentado" ? "Rent" : "Sale",
                                    Amount = command.PrecioCierre ?? property.Precio,
                                    TransactionDate = DateTimeOffset.UtcNow,
                                    Notes = $"Cierre realizado desde el perfil del contacto. Propiedad '{property.Titulo}' marcada como {estado}."
                                };
                                context.PropertyTransactions.Add(propTransaction);

                                // Registrar interacción
                                var interaction = new Interaction
                                {
                                    Id = Guid.NewGuid(),
                                    AgenteId = agenteId,
                                    ContactoId = id,
                                    PropiedadId = property.Id,
                                    TipoInteraccion = "Cierre",
                                    Notas = $"Cierre realizado desde el perfil del contacto. Propiedad '{property.Titulo}' marcada como {estado} por {command.PrecioCierre:C}."
                                };
                                context.Interactions.Add(interaction);
                            }
                        }
                    }
                }
                else
                {
                    contacto.FechaCierre = null;
                }

                // Crear tarea automática si es una Cita
                if (command.NuevaEtapa == "Cita")
                {
                    var task = new TaskItem
                    {
                        Id = Guid.NewGuid(),
                        AgenteId = agenteId,
                        ContactoId = id,
                        Titulo = $"Visita Programada: {contacto.Nombre} {contacto.Apellido}",
                        TipoTarea = "Visita",
                        FechaInicio = DateTimeOffset.UtcNow.AddDays(1),
                        DuracionMinutos = 60,
                        Estado = "Pendiente"
                    };
                    context.Tasks.Add(task);
                }

                await context.SaveChangesAsync(ct);

                // Limpiar caché y precalentar KPIs
                await cacheStore.EvictByTagAsync("dashboard-data", ct);
                await cacheStore.EvictByTagAsync("analytics-data", ct);
                warmingService.NotifyChange(agenteId);

                return Results.NoContent();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error al cambiar etapa de contacto {Id}", id);
                return Results.Problem("Error interno al procesar el cambio de etapa.");
            }
        })
        .RequireAuthorization()
        .WithTags("Contactos")
        .WithName("CambiarEtapaContacto");
    }
}
