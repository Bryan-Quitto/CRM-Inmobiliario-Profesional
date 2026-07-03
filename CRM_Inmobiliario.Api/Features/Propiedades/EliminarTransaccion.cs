using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Features.Dashboard;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.OutputCaching;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class EliminarTransaccionFeature
{
    public static RouteHandlerBuilder MapEliminarTransaccionEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapDelete("/transactions/{id:guid}", async (
            Guid id, 
            ClaimsPrincipal user, 
            CrmDbContext context,
            IOutputCacheStore cacheStore,
            IKpiWarmingService warmingService,
            CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();

            // 1. Obtener la transacción y la propiedad asociada
            var transaction = await context.PropertyTransactions
                .Include(t => t.Property)
                .FirstOrDefaultAsync(t => t.Id == id && t.CreatedById == agenteId, ct);

            if (transaction == null || transaction.Property == null)
            {
                return Results.NotFound(new { Message = "Transacción no encontrada." });
            }

            var property = transaction.Property;

            // 2. Regla de Cascada Lógica:
            // Si eliminamos una transacción de Sale/Rent que coincide con el titular actual del cierre,
            // revertimos la propiedad a "Disponible" y al Contacto a "En Negociación".
            var esCierreDefinitorio = (transaction.TransactionType is "Sale" or "Rent") && 
                                      (property.CerradoConId == transaction.ContactoId);

            if (esCierreDefinitorio)
            {
                property.EstadoComercial = "Disponible";
                property.FechaCierre = null;
                property.PrecioCierre = null;
                
                if (transaction.ContactoId.HasValue)
                {
                    var contactoToRevert = await context.Contactos.FirstOrDefaultAsync(l => l.Id == transaction.ContactoId.Value, ct);
                    if (contactoToRevert != null)
                    {
                        bool tieneOtrasCerradas = await context.Properties.AnyAsync(p => 
                            p.CerradoConId == contactoToRevert.Id && 
                            p.Id != property.Id && 
                            (p.EstadoComercial == "Vendida" || p.EstadoComercial == "Alquilada"), ct);

                        if (!tieneOtrasCerradas)
                        {
                            bool tieneOtrasReservadas = await context.Properties.AnyAsync(p => 
                                p.CerradoConId == contactoToRevert.Id && 
                                p.Id != property.Id && 
                                p.EstadoComercial == "Reservada", ct);

                            if (tieneOtrasReservadas)
                            {
                                contactoToRevert.EstadoEmbudo = "En Negociación";
                                contactoToRevert.FechaCierre = null;
                            }
                            else
                            {
                                contactoToRevert.EstadoEmbudo = "Contactado";
                                contactoToRevert.FechaCierre = null;
                            }
                        }
                    }
                }
                
                property.CerradoConId = null;

                // Reactivamos al propietario
                if (property.PropietarioId.HasValue)
                {
                    var propietario = await context.Contactos.FirstOrDefaultAsync(c => c.Id == property.PropietarioId.Value, ct);
                    if (propietario != null && propietario.EstadoPropietario != "Activo")
                    {
                        propietario.EstadoPropietario = "Activo";
                        context.Entry(propietario).State = EntityState.Modified;
                    }
                }
            }

            // Phase 5: Estrictamente prohibido el borrado físico.
            transaction.TransactionStatus = "Cancelled";
            transaction.Notes = (transaction.Notes ?? "") + " [Anulado por el agente]";
            
            await context.SaveChangesAsync(ct);

            await context.UpsertAgentPropertyActivityAsync(agenteId, property.Id, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), ct);
            if (transaction.ContactoId.HasValue)
            {
                await context.UpsertAgentContactActivityAsync(agenteId, transaction.ContactoId.Value, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), ct);
            }

            // 3. Invalidar caches e informar al warming service
            warmingService.NotifyChange(agenteId);
            await cacheStore.EvictByTagAsync("dashboard-data", ct);
            await cacheStore.EvictByTagAsync("analytics-data", ct);

            return Results.NoContent();
        })
        .WithTags("Transacciones")
        .WithName("EliminarTransaccion");
    }
}
