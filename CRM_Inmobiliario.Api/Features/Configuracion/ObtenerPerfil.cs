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

            return perfil is not null 
                ? Results.Ok(perfil) 
                : Results.NotFound();
        })
        .WithTags("Configuracion")
        .WithName("ObtenerPerfil");
    }
}
