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

            var query = context.Agents.AsNoTracking();

            if (currentAgent?.AgenciaId != null)
            {
                // En una agencia, ves a tus colegas Y a los que tú mismo hayas invitado/creado
                query = query.Where(a => a.AgenciaId == currentAgent.AgenciaId || a.CreatedById == currentUserId);
            }
            else
            {
                // Si eres independiente, te ves a ti mismo Y a los agentes que tú hayas invitado/creado
                query = query.Where(a => a.Id == currentUserId || a.CreatedById == currentUserId);
            }

            var agentes = await query
                .OrderBy(a => a.Nombre)
                .Select(a => new AgentResponse(a.Id, a.Nombre, a.Apellido, a.Telefono, a.Email, a.Activo))
                .ToListAsync();

            return Results.Ok(agentes);
        })
        .WithTags("Configuracion")
        .WithName("ListarAgentes");
    }
}
