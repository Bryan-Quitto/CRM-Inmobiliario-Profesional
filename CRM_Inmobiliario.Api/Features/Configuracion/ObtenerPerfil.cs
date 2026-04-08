using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public static class ObtenerPerfilFeature
{
    public record Response(
        Guid Id,
        string Nombre,
        string Apellido,
        string Email,
        string? Telefono,
        string? Agencia,
        string? FotoUrl,
        string? LogoUrl,
        string Rol,
        DateTimeOffset FechaCreacion);

    public static RouteHandlerBuilder MapObtenerPerfilEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/perfil", async (ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();
            var email = user.FindFirstValue(ClaimTypes.Email) 
                        ?? user.FindFirstValue("email") 
                        ?? user.FindFirstValue("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress") 
                        ?? "";

            Console.WriteLine($"DEBUG [ObtenerPerfil]: Buscando agente {agenteId} ({email})");

            var perfil = await context.Agents
                .AsNoTracking()
                .Where(a => a.Id == agenteId)
                .Select(a => new Response(
                    a.Id,
                    a.Nombre,
                    a.Apellido,
                    a.Email,
                    a.Telefono,
                    a.Agencia,
                    a.FotoUrl,
                    a.LogoUrl,
                    a.Rol,
                    a.FechaCreacion))
                .FirstOrDefaultAsync();

            if (perfil is null)
            {
                Console.WriteLine($"DEBUG [ObtenerPerfil]: Agente no encontrado en DB. Devolviendo perfil base.");
                return Results.Ok(new Response(
                    agenteId,
                    "",
                    "",
                    email,
                    null,
                    null,
                    null,
                    null,
                    "Agente",
                    DateTimeOffset.UtcNow
                ));
            }

            Console.WriteLine($"DEBUG [ObtenerPerfil]: Agente encontrado: {perfil.Nombre} {perfil.Apellido}");
            return Results.Ok(perfil);
        })
        .WithTags("Configuracion")
        .WithName("ObtenerPerfil");
    }
}
