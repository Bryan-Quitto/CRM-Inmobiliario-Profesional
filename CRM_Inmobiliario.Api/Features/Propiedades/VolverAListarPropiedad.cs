using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class VolverAListarPropiedadFeature
{
    public record Request(string? Notas, string Mode = "Relist"); // "Relist" (Natural) o "Cancel" (Trato Caído)

    public static RouteHandlerBuilder MapVolverAListarPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapPost("/propiedades/{id:guid}/relist", async (Guid id, Request? request, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();
            var ecuadorNow = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5));
            var mode = request?.Mode ?? "Relist";

            // Cargamos la propiedad para validar y actualizar
            var propiedad = await context.Properties
                .Include(p => p.Transactions.Where(t => t.TransactionStatus == "Active"))
                .FirstOrDefaultAsync(p => p.Id == id && (p.AgenteId == agenteId || p.CreatedByAgenteId == agenteId));

            if (propiedad is null)
            {
                return Results.NotFound();
            }

            // Identificamos la transacción de cierre activa (Sale o Rent)
            var transaccionActiva = propiedad.Transactions
                .FirstOrDefault(t => t.TransactionType == "Sale" || t.TransactionType == "Rent");

            if (mode == "Cancel")
            {
                // Acción B: Cancelación de Trato (Trato Caído)
                if (propiedad.CerradoConId.HasValue)
                {
                    var contacto = await context.Contactos.FirstOrDefaultAsync(l => l.Id == propiedad.CerradoConId.Value && l.AgenteId == agenteId);
                    if (contacto != null)
                    {
                        contacto.EtapaEmbudo = "En Negociación"; // Reversión automática
                        contacto.FechaCierre = null;
                    }
                }

                if (transaccionActiva != null)
                {
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
            }
            else
            {
                // Acción A: Relistado Natural (Fin de Ciclo)
                if (transaccionActiva != null)
                {
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
                
                // Nota: El Contacto permanece en su estado actual (Cerrado) según Spec
            }

            // Actualizamos estado de la propiedad
            propiedad.EstadoComercial = "Disponible";
            propiedad.CerradoConId = null;
            propiedad.FechaCierre = null;
            propiedad.PrecioCierre = null;

            await context.SaveChangesAsync();

            return Results.Ok(new { Message = mode == "Cancel" ? "Operación cancelada con éxito" : "Propiedad relistada con éxito" });
        })
        .WithTags("Propiedades")
        .WithName("VolverAListarPropiedad");
    }
}
