using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Analitica;

public record SeguimientoResponse(int SeguimientoRequerido);

public static class ObtenerSeguimientoEndpoint
{
    public static void MapObtenerSeguimientoEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/analitica/seguimiento", async (ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            // D. Seguimiento Requerido: Leads con al menos un interés "Medio" o "Alto"
            var seguimiento = await context.Leads
                .Where(l => l.AgenteId == agenteId)
                .CountAsync(l => l.PropertyInterests.Any(i => i.NivelInteres == "Medio" || i.NivelInteres == "Alto"));

            return Results.Ok(new SeguimientoResponse(seguimiento));
        })
        .WithTags("Analitica")
        .WithName("ObtenerSeguimiento");
    }
}
