using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Contactos;

public static class BotOverrideContactoFeature
{
    public record BotOverrideCommand(string Channel = "WhatsApp");

    public static void MapBotOverrideContactoEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/contactos/{id:guid}/bot-override", async (Guid id, [Microsoft.AspNetCore.Mvc.FromBody] BotOverrideCommand command, ClaimsPrincipal user, CrmDbContext context, CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();
            var contacto = await context.Contactos.FirstOrDefaultAsync(c => c.Id == id && c.AgenteId == agenteId, ct);
            if (contacto == null) return Results.NotFound();

            if (command.Channel == "Facebook")
            {
                contacto.BotActivoFB = true;
                contacto.EstadoIA_FB = null;
            }
            else
            {
                contacto.BotActivoWA = true;
                contacto.EstadoIA_WA = null;
            }
            
            var targetDate = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)).Date;
            var usage = await context.ContactDailyTokenUsages
                .FirstOrDefaultAsync(u => u.ContactoId == id && u.Date.Date == targetDate && u.Channel == command.Channel, ct);
                
            if (usage != null)
            {
                // Solo reseteamos los tokens contabilizados para el límite
                usage.TokensUsed = 0;
                usage.InputTokens = 0;
                usage.OutputTokens = 0;
            }

            contacto.FechaUltimaActividad = DateTimeOffset.UtcNow;
            await context.SaveChangesAsync(ct);
            return Results.Ok(contacto);
        });
    }
}
