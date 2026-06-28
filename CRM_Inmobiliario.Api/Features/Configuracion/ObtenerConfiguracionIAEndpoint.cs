using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public record IASettingsResponse(
    string? AiApiKey,
    string? WhatsAppPhoneNumberId,
    int DailyTokenLimitPerContact,
    int DailyTokenLimitPersonal,
    bool IsPersonalAiEnabled,
    bool IsWhatsAppAiEnabled,
    bool AutoCreateWhatsAppContacts,
    int TokensUsedToday,
    string? FacebookPageId,
    string? FacebookPageName,
    bool IsFacebookAiEnabled,
    bool AutoCreateFacebookContacts,
    int DailyTokenLimitFacebook);

public static class ObtenerConfiguracionIAEndpoint
{
    public static IEndpointRouteBuilder MapObtenerConfiguracionIA(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/configuracion/ia-settings", async (ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();
            var today = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)).Date;
            
            var tokensUsedToday = await context.AgentDailyTokenUsages
                .Where(u => u.AgentId == agenteId && u.Date == today)
                .Select(u => u.TokensUsed)
                .FirstOrDefaultAsync();

            var settings = await context.Agents
                .AsNoTracking()
                .Where(a => a.Id == agenteId)
                .Select(a => new IASettingsResponse(
                    a.AiApiKey,
                    a.WhatsAppPhoneNumberId,
                    a.DailyTokenLimitPerContact,
                    a.DailyTokenLimitPersonal,
                    a.IsPersonalAiEnabled,
                    a.IsWhatsAppAiEnabled,
                    a.AutoCreateWhatsAppContacts,
                    tokensUsedToday,
                    a.FacebookPageId,
                    a.FacebookPageName,
                    a.IsFacebookAiEnabled,
                    a.AutoCreateFacebookContacts,
                    a.DailyTokenLimitFacebook))
                .FirstOrDefaultAsync();

            if (settings is null)
            {
                return Results.NotFound(new { Message = "Agente no encontrado." });
            }

            return Results.Ok(settings);
        })
        .WithTags("Configuracion")
        .WithName("ObtenerConfiguracionIA");

        return endpoints;
    }
}
