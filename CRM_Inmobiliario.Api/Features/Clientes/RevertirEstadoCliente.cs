using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Clientes;

public static class RevertirEstadoClienteFeature
{
    public record Request(string NuevaEtapa, bool LiberarPropiedades, string? Notas);

    public static RouteHandlerBuilder MapRevertirEstadoClienteEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapPost("/leads/{id:guid}/revert-status", async (Guid id, Request request, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();
            var ecuadorNow = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5));

            var lead = await context.Leads
                .FirstOrDefaultAsync(l => l.Id == id && l.AgenteId == agenteId);

            if (lead is null)
            {
                return Results.NotFound();
            }

            // Revertimos la etapa del lead
            lead.EtapaEmbudo = request.NuevaEtapa;
            lead.FechaCierre = null;

            if (request.LiberarPropiedades)
            {
                // Buscamos propiedades donde este cliente era el titular del cierre
                var propiedadesACancelar = await context.Properties
                    .Include(p => p.Transactions.Where(t => t.TransactionStatus == "Active"))
                    .Where(p => p.CerradoConId == id && p.AgenteId == agenteId)
                    .ToListAsync();

                foreach (var prop in propiedadesACancelar)
                {
                    prop.EstadoComercial = "Disponible";
                    prop.CerradoConId = null;
                    prop.FechaCierre = null;
                    prop.PrecioCierre = null;

                    // Marcamos transacciones activas de cierre como canceladas
                    var transaccionesActivas = prop.Transactions
                        .Where(t => t.TransactionType == "Sale" || t.TransactionType == "Rent");
                    
                    foreach(var t in transaccionesActivas)
                    {
                        t.TransactionStatus = "Cancelled";
                    }

                    context.PropertyTransactions.Add(new PropertyTransaction
                    {
                        Id = Guid.NewGuid(),
                        PropertyId = prop.Id,
                        LeadId = id,
                        TransactionType = "Cancellation",
                        TransactionStatus = "Completed",
                        TransactionDate = ecuadorNow,
                        Notes = request.Notas ?? $"Cierre revertido por cambio de etapa del cliente. {prop.Titulo}",
                        CreatedById = agenteId
                    });
                }
            }

            await context.SaveChangesAsync();

            return Results.Ok(new { Message = "Estado del cliente revertido con éxito" });
        })
        .WithTags("Clientes")
        .WithName("RevertirEstadoCliente");
    }
}
