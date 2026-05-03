using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class ObtenerHistorialPropiedadFeature
{
    public record Response(
        Guid Id,
        string TransactionType,
        string TransactionStatus,
        decimal? Amount,
        DateTimeOffset TransactionDate,
        string? Notes,
        string AgenteNombre,
        Guid? ContactoId,
        string? ContactoNombre);

    public static RouteHandlerBuilder MapObtenerHistorialPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/propiedades/{id:guid}/history", async (Guid id, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            // The One Trip Pattern: Única proyección LINQ optimizada
            var logs = await context.PropertyTransactions
                .AsNoTracking()
                .Where(t => t.PropertyId == id && (t.Property!.AgenteId == agenteId || t.Property!.CreatedByAgenteId == agenteId))
                .OrderByDescending(t => t.TransactionDate)
                .Select(t => new Response(
                    t.Id,
                    t.TransactionType,
                    t.TransactionStatus,
                    t.Amount,
                    t.TransactionDate,
                    t.Notes,
                    t.CreatedBy != null ? t.CreatedBy.Nombre + " " + t.CreatedBy.Apellido : "Sistema",
                    t.ContactoId,
                    t.Contacto != null ? t.Contacto.Nombre + " " + t.Contacto.Apellido : null))
                .ToListAsync();

            return Results.Ok(logs);
        })
        .WithTags("Propiedades")
        .WithName("ObtenerHistorialPropiedad")
        .CacheOutput(policy => policy
            .Expire(TimeSpan.FromSeconds(30))
            .SetVaryByRouteValue("id")
            .VaryByValue((context, ct) => ValueTask.FromResult(new KeyValuePair<string, string>("Authorization", context.Request.Headers.Authorization.ToString()))));
    }
}
