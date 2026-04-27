using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public static class ActualizarPerfil
{
    public record Request(
        string Nombre,
        string Apellido,
        string Telefono,
        Guid? AgenciaId,
        string? FotoUrl,
        string? LogoUrl);

    public static IEndpointRouteBuilder MapActualizarPerfilEndpoint(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPut("/configuracion/perfil", async (Request request, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();
            var email = user.FindFirstValue(ClaimTypes.Email) 
                        ?? user.FindFirstValue("email") 
                        ?? user.FindFirstValue("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress") 
                        ?? "";

            var rowsAffected = await context.Agents
                .Where(a => a.Id == agenteId)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(a => a.Nombre, request.Nombre)
                    .SetProperty(a => a.Apellido, request.Apellido)
                    .SetProperty(a => a.Telefono, request.Telefono.NormalizeEcuadorPhone())
                    .SetProperty(a => a.AgenciaId, request.AgenciaId)
                    .SetProperty(a => a.FotoUrl, request.FotoUrl)
                    .SetProperty(a => a.LogoUrl, request.LogoUrl));

            // Si no se afectaron filas, es que el agente no existe en la tabla public.Agents
            if (rowsAffected == 0)
            {
                var nuevoAgente = new Agent
                {
                    Id = agenteId,
                    Nombre = request.Nombre,
                    Apellido = request.Apellido,
                    Email = email,
                    Telefono = request.Telefono.NormalizeEcuadorPhone(),
                    AgenciaId = request.AgenciaId,
                    FotoUrl = request.FotoUrl,
                    LogoUrl = request.LogoUrl,
                    Rol = "Agente",
                    Activo = true,
                    FechaCreacion = DateTimeOffset.UtcNow
                };

                context.Agents.Add(nuevoAgente);
                await context.SaveChangesAsync();
            }

            return Results.NoContent();
        })
        .WithTags("Configuracion")
        .WithName("ActualizarPerfil");

        return endpoints;
    }
}
