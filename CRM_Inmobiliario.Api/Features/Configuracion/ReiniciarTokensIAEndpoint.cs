using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public static class ReiniciarTokensIAEndpoint
{
    public static IEndpointRouteBuilder MapReiniciarTokensIA(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/configuracion/ia-settings/reset-tokens", async (ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();
            var today = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)).Date;
            
            var cacheKey = agenteId.ToString();
            var semaphore = CRM_Inmobiliario.Api.Features.AgentAi.Services.AgentAiService.Locks.GetOrAdd(cacheKey, _ => new SemaphoreSlim(1, 1));
            
            await semaphore.WaitAsync();
            try
            {
                var usage = await context.AgentDailyTokenUsages
                    .FirstOrDefaultAsync(u => u.AgentId == agenteId && u.Date == today);

                if (usage != null)
                {
                    usage.TokensUsed = 0;
                    usage.InputTokens = 0;
                    usage.CachedTokens = 0;
                    usage.OutputTokens = 0;
                    // No modificar CostoUSD para preservar el historial
                    
                    await context.SaveChangesAsync();
                }
            }
            finally
            {
                semaphore.Release();
            }

            return Results.Ok(new { Message = "Contador de tokens reiniciado exitosamente." });
        })
        .WithTags("Configuracion")
        .WithName("ReiniciarTokensIA");

        return endpoints;
    }
}
