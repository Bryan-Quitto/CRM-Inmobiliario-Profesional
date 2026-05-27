using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public static class ConfiguracionIAEndpoints
{
    public record IASettingsResponse(
        string? AiApiKey,
        string? WhatsAppPhoneNumberId,
        int DailyTokenLimitPerContact);

    public record UpdateIASettingsRequest(
        int DailyTokenLimitPerContact);

    public static IEndpointRouteBuilder MapConfiguracionIAEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/configuracion/ia-settings", async (ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();
            var settings = await context.Agents
                .AsNoTracking()
                .Where(a => a.Id == agenteId)
                .Select(a => new IASettingsResponse(
                    a.AiApiKey,
                    a.WhatsAppPhoneNumberId,
                    a.DailyTokenLimitPerContact))
                .FirstOrDefaultAsync();

            if (settings is null)
            {
                return Results.NotFound(new { Message = "Agente no encontrado." });
            }

            return Results.Ok(settings);
        })
        .WithTags("Configuracion")
        .WithName("ObtenerConfiguracionIA");

        endpoints.MapPut("/configuracion/ia-settings", async (UpdateIASettingsRequest request, ClaimsPrincipal user, CrmDbContext context) =>
        {
            if (request.DailyTokenLimitPerContact < 20000 || request.DailyTokenLimitPerContact > 1000000)
            {
                return Results.BadRequest(new { Message = "El límite de tokens debe estar entre 20,000 y 1,000,000." });
            }

            var agenteId = user.GetRequiredUserId();
            var agente = await context.Agents.FindAsync(agenteId);

            if (agente is null)
            {
                return Results.NotFound(new { Message = "Agente no encontrado." });
            }

            agente.DailyTokenLimitPerContact = request.DailyTokenLimitPerContact;
            await context.SaveChangesAsync();

            return Results.Ok(new { Message = "Configuración actualizada exitosamente." });
        })
        .WithTags("Configuracion")
        .WithName("ActualizarConfiguracionIA");

        return endpoints;
    }
}
