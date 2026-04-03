using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Calendario;

public static class ReprogramarEventoFeature
{
    public record Command(DateTimeOffset FechaInicio, int? DuracionMinutos);

    public static void MapReprogramarEventoEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPatch("/calendario/{id}/reprogramar", async (Guid id, Command command, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            // Normalizar a UTC para evitar error de Npgsql con offsets distintos de cero
            var fechaInicioUtc = command.FechaInicio.ToUniversalTime();

            // Usar ExecuteUpdateAsync para máximo rendimiento
            var rowsAffected = await context.Tasks
                .Where(t => t.Id == id && t.AgenteId == agenteId)
                .ExecuteUpdateAsync(setter => setter
                    .SetProperty(t => t.FechaInicio, fechaInicioUtc)
                    .SetProperty(t => t.DuracionMinutos, t => command.DuracionMinutos ?? t.DuracionMinutos));

            if (rowsAffected == 0)
            {
                return Results.NotFound("El evento no existe o no te pertenece.");
            }

            return Results.NoContent();
        })
        .WithTags("Calendario")
        .WithName("ReprogramarEvento");
    }
}
