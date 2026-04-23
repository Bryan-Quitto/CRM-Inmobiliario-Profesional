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
    public record Request(string? Notas);

    public static RouteHandlerBuilder MapVolverAListarPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapPost("/propiedades/{id:guid}/relist", async (Guid id, Request? request, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();
            var ecuadorNow = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5));

            // Cargamos la propiedad para validar y actualizar
            var propiedad = await context.Properties
                .FirstOrDefaultAsync(p => p.Id == id && p.AgenteId == agenteId);

            if (propiedad is null)
            {
                return Results.NotFound();
            }

            // Spec 011: Si la propiedad estaba cerrada con un Lead, revertir el Lead y limpiar transacciones
            if (propiedad.CerradoConId.HasValue)
            {
                var lead = await context.Leads.FirstOrDefaultAsync(l => l.Id == propiedad.CerradoConId.Value && l.AgenteId == agenteId);
                if (lead != null)
                {
                    lead.EtapaEmbudo = "En Negociación"; // Reversión lógica
                    lead.FechaCierre = null;
                }

                // Eliminamos la transacción de cierre asociada
                var transaccionesCierre = await context.PropertyTransactions
                    .Where(t => t.PropertyId == id && t.LeadId == propiedad.CerradoConId.Value && (t.TransactionType == "Sale" || t.TransactionType == "Rent"))
                    .ToListAsync();
                
                if (transaccionesCierre.Any())
                {
                    context.PropertyTransactions.RemoveRange(transaccionesCierre);
                }
            }

            // Actualizamos estado y limpiamos vinculación de cierre si existía
            propiedad.EstadoComercial = "Disponible";
            propiedad.CerradoConId = null;
            propiedad.FechaCierre = null;
            propiedad.PrecioCierre = null;

            // Registramos la transacción histórica
            var transaccion = new PropertyTransaction
            {
                Id = Guid.NewGuid(),
                PropertyId = id,
                TransactionType = "Relisting",
                TransactionDate = ecuadorNow,
                Notes = request?.Notas ?? "Propiedad vuelta a listar automáticamente.",
                CreatedById = agenteId
            };

            context.PropertyTransactions.Add(transaccion);
            await context.SaveChangesAsync();

            return Results.Ok(new { Message = "Propiedad vuelta a listar con éxito" });
        })
        .WithTags("Propiedades")
        .WithName("VolverAListarPropiedad");
    }
}
