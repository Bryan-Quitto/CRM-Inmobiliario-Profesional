using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.OutputCaching;
using CRM_Inmobiliario.Api.Domain.Enums;

namespace CRM_Inmobiliario.Api.Features.Contactos;

public static class UpdateConsentimientoContactoFeature
{
    public record UpdateConsentimientoCommand(string? ConsentimientoWA, string? ConsentimientoFB);

    public static void MapUpdateConsentimientoContactoEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPut("/contactos/{id:guid}/consentimiento", async (
            Guid id, 
            [FromBody] UpdateConsentimientoCommand command, 
            ClaimsPrincipal user, 
            CrmDbContext context, 
            IOutputCacheStore cacheStore,
            CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();

            var contactoStatus = await context.Contactos
                .Where(c => c.Id == id && c.AgenteId == agenteId)
                .Select(c => new { c.Id })
                .FirstOrDefaultAsync(ct);

            if (contactoStatus == null)
            {
                return Results.NotFound();
            }

            int updatedCount = await context.Contactos
                .Where(c => c.Id == id && c.AgenteId == agenteId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(c => c.ConsentimientoIA_WA, command.ConsentimientoWA)
                    .SetProperty(c => c.ConsentimientoIA_FB, command.ConsentimientoFB), ct);

            if (updatedCount == 0)
            {
                return Results.NotFound();
            }

            await context.UpsertAgentContactActivityAsync(agenteId, id, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), ct);
            await cacheStore.EvictByTagAsync("contactos", ct);

            return Results.NoContent();
        })
        .RequireAuthorization()
        .WithTags("Contactos")
        .WithName("UpdateConsentimientoContacto");
    }
}
