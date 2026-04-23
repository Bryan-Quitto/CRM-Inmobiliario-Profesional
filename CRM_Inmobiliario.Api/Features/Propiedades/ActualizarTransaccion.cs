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

public static class ActualizarTransaccionFeature
{
    public record Command(
        DateTimeOffset TransactionDate,
        decimal? Amount,
        Guid? LeadId,
        string? Notes);

    public static RouteHandlerBuilder MapActualizarTransaccionEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapPut("/transactions/{id:guid}", async (
            Guid id, 
            Command command, 
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
            var oldLeadId = transaction.LeadId;
            var oldDate = transaction.TransactionDate;

            // 2. Regla de Sincronización: 
            // Si la transacción es del tipo Sale o Rent y coincide con los datos actuales de la propiedad,
            // actualizamos la propiedad también.
            var esCierreActivo = (transaction.TransactionType is "Sale" or "Rent") && 
                                 (property.FechaCierre == oldDate && property.CerradoConId == oldLeadId);

            // 3. Actualizar campos (Forzando UTC para PostgreSQL)
            transaction.TransactionDate = command.TransactionDate.ToUniversalTime();
            transaction.Amount = command.Amount;
            transaction.LeadId = command.LeadId;
            transaction.Notes = command.Notes;

            if (esCierreActivo)
            {
                property.FechaCierre = transaction.TransactionDate;
                property.PrecioCierre = transaction.Amount;
                property.CerradoConId = transaction.LeadId;
            }

            await context.SaveChangesAsync(ct);

            // 4. Invalidar caches e informar al warming service
            warmingService.NotifyChange(agenteId);
            await cacheStore.EvictByTagAsync("dashboard-data", ct);
            await cacheStore.EvictByTagAsync("analytics-data", ct);

            return Results.NoContent();
        })
        .WithTags("Transacciones")
        .WithName("ActualizarTransaccion");
    }
}
