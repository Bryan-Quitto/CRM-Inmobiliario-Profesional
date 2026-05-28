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
    public record AgentResponse(Guid Id, string Nombre, string Apellido, string? Telefono, string Email, bool Activo, string? FotoUrl, bool AlreadyHasContact = false);

    public static void MapListarAgentesEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/configuracion/agentes", async (Guid? checkContactoId, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var currentUserId = user.GetRequiredUserId();
            
            string? contactPhoneToShare = null;
            string? cleanPhoneToShare = null;

            if (checkContactoId.HasValue)
            {
                contactPhoneToShare = await context.Contactos
                    .AsNoTracking()
                    .Where(c => c.Id == checkContactoId.Value)
                    .Select(c => c.Telefono)
                    .FirstOrDefaultAsync();
                
                if (contactPhoneToShare != null)
                {
                    cleanPhoneToShare = new string(contactPhoneToShare.Where(char.IsDigit).ToArray());
                }
            }

            var currentAgent = await context.Agents
                .AsNoTracking()
                .Where(a => a.Id == currentUserId)
                .Select(a => new { a.AgenciaId })
                .FirstOrDefaultAsync();

            var query = context.Agents.AsNoTracking();

            bool isAdmin = false;
            var appMetadata = user.FindFirst("app_metadata")?.Value;
            if (!string.IsNullOrEmpty(appMetadata))
            {
                try
                {
                    using var doc = System.Text.Json.JsonDocument.Parse(appMetadata);
                    isAdmin = doc.RootElement.TryGetProperty("role", out var roleElement) && roleElement.GetString() == "Admin";
                }
                catch { }
            }

            if (isAdmin)
            {
                // El Super Admin ve a TODOS los agentes del sistema.
            }
            else if (currentAgent?.AgenciaId != null)
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
                .Select(a => new AgentResponse(
                    a.Id, 
                    a.Nombre, 
                    a.Apellido, 
                    a.Telefono, 
                    a.Email, 
                    a.Activo, 
                    a.FotoUrl,
                    false // Lo calculamos en memoria para poder usar lógica compleja y loguear
                ))
                .ToListAsync();

            if (cleanPhoneToShare != null)
            {
                // Traer los contactos de todos estos agentes para ver por qué falla la coincidencia
                var agenteIds = agentes.Select(a => a.Id).ToList();
                var contactosAgencia = await context.Contactos
                    .AsNoTracking()
                    .Where(c => agenteIds.Contains(c.AgenteId))
                    .Select(c => new { c.AgenteId, c.Telefono })
                    .ToListAsync();

                foreach(var c in contactosAgencia)
                {
                    var cleanContactPhone = new string(c.Telefono.Where(char.IsDigit).ToArray());
                    if (cleanContactPhone == cleanPhoneToShare || c.Telefono == contactPhoneToShare)
                    {
                        var index = agentes.FindIndex(x => x.Id == c.AgenteId);
                        if (index >= 0) agentes[index] = agentes[index] switch { var ag => new AgentResponse(ag.Id, ag.Nombre, ag.Apellido, ag.Telefono, ag.Email, ag.Activo, ag.FotoUrl, true) };
                    }
                }
            }

            return Results.Ok(agentes);
        })
        .WithTags("Configuracion")
        .WithName("ListarAgentes");
    }
}
