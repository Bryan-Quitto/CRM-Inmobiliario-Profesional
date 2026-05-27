using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public static class AdminApiKeysFeature
{
    public record AdminAgentKeyResponse(Guid Id, string Nombre, string Apellido, string? AiApiKey, string? WhatsAppPhoneNumberId, int DailyTokenLimitPerContact);
    public record UpdateKeysRequest(string? AiApiKey, string? WhatsAppPhoneNumberId, int? DailyTokenLimitPerContact);

    public static void MapAdminApiKeysEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/admin/api-keys").RequireAuthorization("AdminPolicy").WithTags("Admin");

        group.MapGet("/", async (ClaimsPrincipal user, CrmDbContext context) =>
        {


            var agentes = await context.Agents
                .AsNoTracking()
                .OrderBy(a => a.Nombre)
                .Select(a => new AdminAgentKeyResponse(a.Id, a.Nombre, a.Apellido, a.AiApiKey, a.WhatsAppPhoneNumberId, a.DailyTokenLimitPerContact))
                .ToListAsync();

            return Results.Ok(agentes);
        });

        group.MapPut("/{id:guid}", async (Guid id, UpdateKeysRequest request, ClaimsPrincipal user, CrmDbContext context) =>
        {

            var agent = await context.Agents.FirstOrDefaultAsync(a => a.Id == id);
            if (agent == null) return Results.NotFound();

            agent.AiApiKey = request.AiApiKey;
            agent.WhatsAppPhoneNumberId = request.WhatsAppPhoneNumberId;
            if (request.DailyTokenLimitPerContact.HasValue)
            {
                agent.DailyTokenLimitPerContact = request.DailyTokenLimitPerContact.Value;
            }

            await context.SaveChangesAsync();

            return Results.Ok(new AdminAgentKeyResponse(agent.Id, agent.Nombre, agent.Apellido, agent.AiApiKey, agent.WhatsAppPhoneNumberId, agent.DailyTokenLimitPerContact));
        });
    }
}
