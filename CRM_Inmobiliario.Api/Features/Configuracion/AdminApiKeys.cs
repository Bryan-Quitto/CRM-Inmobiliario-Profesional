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
    public record AdminAgentKeyResponse(Guid Id, string Nombre, string Apellido, string? AiApiKey, string? WhatsAppPhoneNumberId);
    public record UpdateKeysRequest(string? AiApiKey, string? WhatsAppPhoneNumberId);

    public static void MapAdminApiKeysEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/admin/api-keys").RequireAuthorization().WithTags("Admin");

        group.MapGet("/", async (ClaimsPrincipal user, CrmDbContext context) =>
        {
            var currentUserId = user.GetRequiredUserId();
            
            // Only allow Super Admin (UUID: d4a6efdd-b801-40fb-901e-64e36f6b1400)
            if (currentUserId.ToString() != "d4a6efdd-b801-40fb-901e-64e36f6b1400")
            {
                return Results.Forbid();
            }

            var agentes = await context.Agents
                .AsNoTracking()
                .OrderBy(a => a.Nombre)
                .Select(a => new AdminAgentKeyResponse(a.Id, a.Nombre, a.Apellido, a.AiApiKey, a.WhatsAppPhoneNumberId))
                .ToListAsync();

            return Results.Ok(agentes);
        });

        group.MapPut("/{id:guid}", async (Guid id, UpdateKeysRequest request, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var currentUserId = user.GetRequiredUserId();
            
            if (currentUserId.ToString() != "d4a6efdd-b801-40fb-901e-64e36f6b1400")
            {
                return Results.Forbid();
            }

            var agent = await context.Agents.FirstOrDefaultAsync(a => a.Id == id);
            if (agent == null) return Results.NotFound();

            agent.AiApiKey = request.AiApiKey;
            agent.WhatsAppPhoneNumberId = request.WhatsAppPhoneNumberId;

            await context.SaveChangesAsync();

            return Results.Ok(new AdminAgentKeyResponse(agent.Id, agent.Nombre, agent.Apellido, agent.AiApiKey, agent.WhatsAppPhoneNumberId));
        });
    }
}
