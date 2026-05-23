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
        return app.MapPost("/contactos/{id:guid}/revert-status", async (Guid id, Request request, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            var contacto = await context.Contactos
                .Include(c => c.CompartidoCon)
                .FirstOrDefaultAsync(l => l.Id == id && (l.AgenteId == agenteId || l.CompartidoCon.Any(ac => ac.AgenteId == agenteId)));

            if (contacto is null)
            {
                return Results.NotFound(new { Message = "Contacto no encontrado o no autorizado" });
            }

            // Revertimos la etapa del contacto
            contacto.EtapaEmbudo = request.NuevaEtapa;
            contacto.FechaCierre = null;

            // Transacción para asegurar consistencia
            using var tx = await context.Database.BeginTransactionAsync();
            try
            {
                // Buscamos transacciones activas de este contacto
                var activeTransactions = await context.PropertyTransactions
                    .Where(pt => pt.ContactoId == id && pt.TransactionStatus == "Active")
                    .ToListAsync();

                if (request.LiberarPropiedades)
                {
                    // Obtener las propiedades vinculadas a estas transacciones activas
                    var propertyIds = activeTransactions.Select(pt => pt.PropertyId).Distinct().ToList();
                    var propertiesToRevert = await context.Properties
                        .Where(p => propertyIds.Contains(p.Id))
                        .ToListAsync();

                    foreach (var prop in propertiesToRevert)
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
                            Notas = request.Notas ?? $"Operación revertida por cambio de etapa del contacto. Propiedad '{prop.Titulo}' liberada.",
                            FechaInteraccion = DateTimeOffset.UtcNow
                        };
                        context.Interactions.Add(transaction);
                    }
                }

                // En lugar de borrar las transacciones (RemoveRange), las marcamos como Canceladas
                foreach (var pt in activeTransactions)
                {
                    pt.TransactionStatus = "Cancelled";
                    pt.Notes = (pt.Notes ?? "") + $" [Cancelada el {DateTimeOffset.UtcNow:dd/MM/yyyy} por reversión de etapa]";
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
        })
        .RequireAuthorization()
        .WithTags("Contactos")
        .WithName("RevertirEstadoContacto");
    }
}
