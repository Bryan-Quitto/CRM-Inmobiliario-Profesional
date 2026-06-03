using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Contactos;

public static class RevertirEstadoContactoFeature
{
    public record Request(string NuevaEtapa, bool LiberarPropiedades, string? Notas);

    public static RouteHandlerBuilder MapRevertirEstadoContactoEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapPost("/contactos/{id:guid}/revert-status", async (Guid id, Request request, ClaimsPrincipal user, CrmDbContext context, ILogger<CrmDbContext> logger) =>
        {
            var agenteId = user.GetRequiredUserId();

            var contacto = await context.Contactos
                .Include(c => c.CompartidoCon)
                .FirstOrDefaultAsync(l => l.Id == id && l.AgenteId == agenteId);

            if (contacto is null)
            {
                return Results.NotFound(new { Message = "Contacto no encontrado o no autorizado" });
            }

            var etapaAnterior = contacto.EtapaEmbudo;

            // Revertimos la etapa del contacto
            contacto.EtapaEmbudo = request.NuevaEtapa;
            contacto.FechaCierre = null;

            // Transacción para asegurar consistencia
            var strategy = context.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                using var tx = await context.Database.BeginTransactionAsync();
                try
                {
                    // Dependiendo de si estábamos en Negociación o Cerrado, liberamos Reservadas o Vendidas
                    var propiedadesALiberar = new List<Property>();
                    if (etapaAnterior == "En Negociación")
                    {
                        propiedadesALiberar = await context.Properties
                            .Where(p => p.CerradoConId == id && p.EstadoComercial == "Reservada")
                            .ToListAsync();
                    }
                    else if (etapaAnterior == "Cerrado")
                    {
                        propiedadesALiberar = await context.Properties
                            .Where(p => p.CerradoConId == id && (p.EstadoComercial == "Vendida" || p.EstadoComercial == "Alquilada"))
                            .ToListAsync();
                    }

                    if (request.LiberarPropiedades)
                    {
                        // Regla de 1 Propiedad: Solo se puede liberar masivamente si hay EXACTAMENTE 1 propiedad vinculada
                        if (propiedadesALiberar.Count > 1)
                        {
                            var propDetails = string.Join(", ", propiedadesALiberar.Select(p => $"[{p.Id}: {p.Titulo} - {p.EstadoComercial}]"));
                            logger.LogWarning("⚠️ [REVERSIÓN FALLIDA] El contacto {ContactoId} tiene {Count} propiedades a liberar. Propiedades: {Propiedades}", id, propiedadesALiberar.Count, propDetails);

                            return Results.BadRequest(new { Message = $"No se puede revertir el estado automáticamente porque el contacto tiene más de 1 propiedad {(etapaAnterior == "En Negociación" ? "reservada" : "alquilada o vendida")}. Realice el ajuste desde el catálogo de inmuebles para cada propiedad." });
                        }

                        bool esTratoCaido = request.NuevaEtapa == "Perdido" || request.NuevaEtapa == "Cerrado Perdido";

                        // Obtener los IDs de las propiedades que vamos a revertir
                        var propertyIds = propiedadesALiberar.Select(p => p.Id).ToList();

                        // Buscamos transacciones activas de estas propiedades específicas para cerrarlas
                        var activeTransactions = await context.PropertyTransactions
                            .Where(pt => pt.ContactoId == id && pt.TransactionStatus == "Active" && propertyIds.Contains(pt.PropertyId))
                            .ToListAsync();

                        foreach (var prop in propiedadesALiberar)
                        {
                            prop.EstadoComercial = "Disponible";
                            prop.CerradoConId = null;

                            var transaction = new Interaction
                            {
                                Id = Guid.NewGuid(),
                                AgenteId = agenteId,
                                ContactoId = id,
                                PropiedadId = prop.Id,
                                TipoInteraccion = "Sistema",
                                Notas = request.Notas ?? (esTratoCaido ? $"Trato Caído por cambio de etapa a Perdido. Propiedad '{prop.Titulo}' liberada." : $"Fin de Contrato por cambio de etapa. Propiedad '{prop.Titulo}' relistada."),
                                FechaInteraccion = DateTimeOffset.UtcNow
                            };
                            context.Interactions.Add(transaction);
                            
                            // Insertar PropertyTransaction para mantener trazabilidad
                            context.PropertyTransactions.Add(new PropertyTransaction
                            {
                                Id = Guid.NewGuid(),
                                PropertyId = prop.Id,
                                ContactoId = id,
                                TransactionType = esTratoCaido ? "Cancellation" : "Relisting",
                                TransactionStatus = "Completed",
                                TransactionDate = DateTimeOffset.UtcNow,
                                Notes = request.Notas ?? (esTratoCaido ? "Trato caído. Operación anulada desde contacto." : "Fin de ciclo comercial. Propiedad relistada desde contacto."),
                                CreatedById = agenteId
                            });
                        }
                        
                        // Marcar transacciones antiguas como Cancelled (o Completed si es fin de contrato)
                        foreach (var pt in activeTransactions)
                        {
                            pt.TransactionStatus = esTratoCaido ? "Cancelled" : "Completed";
                            pt.Notes = (pt.Notes ?? "") + (esTratoCaido ? $" [Cancelada el {DateTimeOffset.UtcNow:dd/MM/yyyy} por reversión de etapa]" : $" [Completada el {DateTimeOffset.UtcNow:dd/MM/yyyy} por reversión de etapa]");
                        }
                    }

                    await context.SaveChangesAsync();
                    await tx.CommitAsync();

                    return Results.Ok(new { Message = "Estado del contacto revertido con éxito" });
                }
                catch
                {
                    await tx.RollbackAsync();
                    throw;
                }
            });
        })
        .RequireAuthorization()
        .WithTags("Contactos")
        .WithName("RevertirEstadoContacto");
    }
}
