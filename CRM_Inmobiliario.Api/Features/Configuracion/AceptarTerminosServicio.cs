using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public static class AceptarTerminosServicio
{
    public record Request(string Version);

    public static IEndpointRouteBuilder MapAceptarTerminosServicioEndpoint(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPatch("/configuracion/perfil/terminos", async (Request request, ClaimsPrincipal user, CrmDbContext context) =>
        {
            if (string.IsNullOrWhiteSpace(request.Version))
            {
                return Results.BadRequest(new { message = "La versión de los términos no puede estar vacía." });
            }

            var agenteId = user.GetRequiredUserId();
            var agente = await context.Agents.FirstOrDefaultAsync(a => a.Id == agenteId);

            if (agente == null)
            {
                return Results.NotFound(new { message = "Agente no encontrado." });
            }

            agente.TerminosAceptadosVersion = request.Version;
            await context.SaveChangesAsync();

            return Results.Ok(new { message = "Términos de servicio aceptados correctamente." });
        })
        .WithTags("Configuracion")
        .WithName("AceptarTerminosServicio");

        return endpoints;
    }
}
