using System.Security.Claims;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public record ValidateIASettingsRequest(
    string? AiApiKey,
    string? WhatsAppPhoneNumberId);

public static class ValidarConfiguracionIAEndpoint
{
    public static IEndpointRouteBuilder MapValidarConfiguracionIA(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/configuracion/ia-settings/validate", async (ValidateIASettingsRequest request, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();
            
            bool aiKeyInUse = false;
            if (!string.IsNullOrWhiteSpace(request.AiApiKey))
            {
                aiKeyInUse = await context.Agents.AnyAsync(a => a.Id != agenteId && a.AiApiKey == request.AiApiKey);
            }

            bool waIdInUse = false;
            if (!string.IsNullOrWhiteSpace(request.WhatsAppPhoneNumberId))
            {
                waIdInUse = await context.Agents.AnyAsync(a => a.Id != agenteId && a.WhatsAppPhoneNumberId == request.WhatsAppPhoneNumberId);
            }

            return Results.Ok(new { AiKeyInUse = aiKeyInUse, WaIdInUse = waIdInUse });
        })
        .WithTags("Configuracion")
        .WithName("ValidarConfiguracionIA");

        return endpoints;
    }
}
