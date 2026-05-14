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
        return app.MapPost("/propiedades/{id:guid}/relist", async (Guid id, Request? request, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, IKpiWarmingService warmingService, CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();
            var ecuadorNow = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5));
            var mode = request?.Mode ?? "Relist";

            // Obtenemos la agencia del agente actual para validación multi-tenant
            var agenciaId = await context.Agents
                .AsNoTracking()
                .Where(a => a.Id == agenteId)
                .Select(a => a.AgenciaId)
                .FirstOrDefaultAsync(ct);

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
                    // FIX: Permitimos revertir el contacto si tenemos acceso a la propiedad, 
                    // eliminando la restricción de que el agente relistando deba ser el dueño del contacto.
                    var contacto = await context.Contactos.FirstOrDefaultAsync(l => l.Id == propiedad.CerradoConId.Value);
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

            // Reactivamos al propietario si corresponde y definimos el estado final de la propiedad
            var estadoFinalPropiedad = "Disponible";

            if (propiedad.PropietarioId.HasValue)
            {
                var propietario = await context.Contactos.FindAsync(propiedad.PropietarioId.Value);
                if (propietario != null)
                {
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

            try
            {
                await context.SaveChangesAsync(ct);
                
                // Invalidar caches e informar al warming service
                warmingService.NotifyChange(agenteId);
                await cacheStore.EvictByTagAsync("dashboard-data", ct);
                await cacheStore.EvictByTagAsync("analytics-data", ct);
                await cacheStore.EvictByTagAsync("properties-data", ct);

                return Results.Ok(new { Message = mode == "Cancel" ? "Operación cancelada con éxito" : "Propiedad relistada con éxito" });
            }
            catch (DbUpdateConcurrencyException)
            {
                return Results.Conflict(new { Message = "La propiedad fue modificada por otro usuario al mismo tiempo. Por favor, refresca la página e intenta de nuevo." });
            }
        })
        .WithTags("Propiedades")
        .WithName("VolverAListarPropiedad");
    }
}
