using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class ToggleBloqueoLimpiezaPropiedadFeature
{
    public record Command(bool Bloquear);

    public static void MapToggleBloqueoLimpiezaPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPut("/propiedades/{id:guid}/toggle-bloqueo-limpieza", async (
            Guid id, 
            Command command, 
            ClaimsPrincipal user, 
            CrmDbContext context, 
            ILogger<CrmDbContext> logger, 
            CancellationToken ct) =>
        {
            var propiedad = await context.Properties.FirstOrDefaultAsync(p => p.Id == id, ct);
            if (propiedad == null) return Results.NotFound();


            // Bloquear = true means override to blocked
            // Bloquear = false means override to unblocked
            propiedad.BloqueoLimpiezaOverride = command.Bloquear;

            await context.SaveChangesAsync(ct);
            return Results.Ok();
        })
        .RequireAuthorization("AdminPolicy")
        .WithTags("Propiedades");
    }
}