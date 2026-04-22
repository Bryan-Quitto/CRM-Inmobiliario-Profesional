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
            // Si eliminamos una transacción de Sale/Rent que define el estado actual, 
            // revertimos la propiedad a "Disponible".
            var esCierreDefinitorio = (transaction.TransactionType is "Sale" or "Rent") && 
                                      (property.EstadoComercial is "Vendida" or "Alquilada") &&
                                      (property.FechaCierre == transaction.TransactionDate);

            if (esCierreDefinitorio)
            {
                property.EstadoComercial = "Disponible";
                property.FechaCierre = null;
                property.PrecioCierre = null;
                property.CerradoConId = null;
            }

            context.PropertyTransactions.Remove(transaction);
            await context.SaveChangesAsync(ct);

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
