using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.OutputCaching;

namespace CRM_Inmobiliario.Api.Features.Contactos;

public static class ToggleBotActivoFeature
{
    public record ToggleBotActivoCommand(bool BotActivo, string Channel = "WhatsApp");

    public static void MapToggleBotActivoEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPut("/contactos/{id:guid}/toggle-bot", async (
            Guid id, 
            [FromBody] ToggleBotActivoCommand command, 
            ClaimsPrincipal user, 
            CrmDbContext context, 
            IOutputCacheStore cacheStore, 
            IWhatsAppMessageSender messageSender,
            CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();

            var contactoStatus = await context.Contactos
                .Where(c => c.Id == id && c.AgenteId == agenteId)
                .Select(c => new { c.Id, c.EtapaEmbudo })
                .FirstOrDefaultAsync(ct);

            if (contactoStatus == null)
            {
                return Results.NotFound();
            }

            if (command.BotActivo && (contactoStatus.EtapaEmbudo == "En Negociación" || contactoStatus.EtapaEmbudo == "Cerrado" || contactoStatus.EtapaEmbudo == "Cerrado Ganado"))
            {
                return Results.BadRequest(new { Message = "El cliente está en proceso de trámite, por cuestiones de seguridad debe pasar a otro estado para activar la IA." });
            }

            int updatedCount = 0;
            if (command.Channel == "Facebook")
            {
                updatedCount = await context.Contactos
                    .Where(c => c.Id == id && c.AgenteId == agenteId)
                    .ExecuteUpdateAsync(s => s
                        .SetProperty(c => c.BotActivoFB, command.BotActivo)
                        .SetProperty(c => c.EstadoIA_FB, c => command.BotActivo ? null : c.EstadoIA_FB)
                        .SetProperty(c => c.TransferenciaNotificada, c => command.BotActivo ? false : c.TransferenciaNotificada), ct);
            }
            else
            {
                updatedCount = await context.Contactos
                    .Where(c => c.Id == id && c.AgenteId == agenteId)
                    .ExecuteUpdateAsync(s => s
                        .SetProperty(c => c.BotActivoWA, command.BotActivo)
                        .SetProperty(c => c.EstadoIA_WA, c => command.BotActivo ? null : c.EstadoIA_WA)
                        .SetProperty(c => c.TransferenciaNotificada, c => command.BotActivo ? false : c.TransferenciaNotificada), ct);
            }

            if (updatedCount == 0)
            {
                return Results.NotFound();
            }

            await cacheStore.EvictByTagAsync("contactos", ct);

            return Results.NoContent();
        })
        .RequireAuthorization()
        .WithTags("Contactos")
        .WithName("ToggleBotActivoContacto");
    }
}
