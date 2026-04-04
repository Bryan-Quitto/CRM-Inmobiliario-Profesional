using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public static class ActualizarPerfilFeature
{
    public record Request(
        string Nombre,
        string Apellido,
        string? Telefono,
        string? Agencia,
        string? FotoUrl);

    public static RouteHandlerBuilder MapActualizarPerfilEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapPut("/perfil", async (Request request, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            var rowsAffected = await context.Agents
                .Where(a => a.Id == agenteId)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(a => a.Nombre, request.Nombre)
                    .SetProperty(a => a.Apellido, request.Apellido)
                    .SetProperty(a => a.Telefono, request.Telefono)
                    .SetProperty(a => a.Agencia, request.Agencia)
                    .SetProperty(a => a.FotoUrl, request.FotoUrl));

            return rowsAffected > 0 
                ? Results.NoContent() 
                : Results.NotFound();
        })
        .WithTags("Configuracion")
        .WithName("ActualizarPerfil");
    }
}
