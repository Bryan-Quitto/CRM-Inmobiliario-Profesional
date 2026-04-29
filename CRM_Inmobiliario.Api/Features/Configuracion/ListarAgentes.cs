using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public static class ListarAgentesFeature
{
    public record AgentResponse(Guid Id, string Nombre, string Apellido, string? Telefono, string Email, bool Activo);

    public static void MapListarAgentesEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/configuracion/agentes", async (ClaimsPrincipal user, CrmDbContext context) =>
        {
            var currentUserId = user.GetRequiredUserId();
            
            var currentAgent = await context.Agents
                .AsNoTracking()
                .Where(a => a.Id == currentUserId)
                .Select(a => new { a.AgenciaId })
                .FirstOrDefaultAsync();

            if (currentAgent?.AgenciaId == null)
            {
                // Si es independiente, solo se ve a sí mismo (o tal vez nada para esta búsqueda)
                var self = await context.Agents
                    .AsNoTracking()
                    .Where(a => a.Id == currentUserId)
                    .Select(a => new AgentResponse(a.Id, a.Nombre, a.Apellido, a.Telefono, a.Email, a.Activo))
                    .ToListAsync();
                return Results.Ok(self);
            }

            var agentes = await context.Agents
                .AsNoTracking()
                .Where(a => a.AgenciaId == currentAgent.AgenciaId)
                .OrderBy(a => a.Nombre)
                .Select(a => new AgentResponse(a.Id, a.Nombre, a.Apellido, a.Telefono, a.Email, a.Activo))
                .ToListAsync();

            return Results.Ok(agentes);
        })
        .WithTags("Configuracion")
        .WithName("ListarAgentes");
    }
}
