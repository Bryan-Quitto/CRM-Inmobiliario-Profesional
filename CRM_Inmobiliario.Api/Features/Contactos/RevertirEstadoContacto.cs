using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Contactos;

public static class RevertirEstadoContactoFeature
{
    public record Request(string NuevaEtapa, string? Notas);

    public static RouteHandlerBuilder MapRevertirEstadoContactoEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapPost("/contactos/{id:guid}/revert-status", async (Guid id, Request request, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            // Buscamos el contacto asegurando pertenencia al agente
            var contacto = await context.Contactos
                .FirstOrDefaultAsync(l => l.Id == id && l.AgenteId == agenteId);

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
                // Buscamos propiedades donde este contacto era el titular del cierre
                var propertiesToRevert = await context.Properties
                    .Where(p => p.Transactions.Any(pt => pt.ContactoId == id))
                    .ToListAsync();

                foreach (var prop in propertiesToRevert)
                {
                    prop.EstadoComercial = "Disponible";

                    // Opcional: Registrar que se revirtió
                    var transaction = new Interaction
                    {
                        AgenteId = agenteId,
                        ContactoId = id,
                        PropiedadId = prop.Id,
                        TipoInteraccion = "Sistema",
                        Notas = request.Notas ?? $"Cierre revertido por cambio de etapa del contacto. {prop.Titulo}",
                        FechaInteraccion = DateTimeOffset.UtcNow
                    };
                    context.Interactions.Add(transaction);
                }

                // Eliminamos las transacciones de cierre asociadas a este contacto
                var closingTransactions = await context.PropertyTransactions
                    .Where(pt => pt.ContactoId == id)
                    .ToListAsync();

                context.PropertyTransactions.RemoveRange(closingTransactions);

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
