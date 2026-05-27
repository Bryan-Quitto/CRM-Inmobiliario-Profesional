using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Contactos;

public static class BotOverrideContactoFeature
{
    public static void MapBotOverrideContactoEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/contactos/{id:guid}/bot-override", async (Guid id, ClaimsPrincipal user, CrmDbContext context, CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();
            var contacto = await context.Contactos.FirstOrDefaultAsync(c => c.Id == id && c.AgenteId == agenteId, ct);
            if (contacto == null) return Results.NotFound();

            contacto.BotActivo = true;
            contacto.EstadoIA = null;
            
            var targetDate = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)).Date;
            var usage = await context.ContactDailyTokenUsages
                .FirstOrDefaultAsync(u => u.ContactoId == id && u.Date.Date == targetDate, ct);
                
            if (usage != null)
            {
                usage.TokensUsed = 0;
            }

            await context.SaveChangesAsync(ct);
            return Results.Ok(contacto);
        });
    }
}
