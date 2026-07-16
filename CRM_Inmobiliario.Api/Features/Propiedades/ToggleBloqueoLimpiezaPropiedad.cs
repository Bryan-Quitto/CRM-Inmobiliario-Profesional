using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
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
            [FromBody] Command command, 
            ClaimsPrincipal user, 
            CrmDbContext context, 
            ILogger<CrmDbContext> logger, 
            CancellationToken ct) =>
        {
            var currentUserId = user.GetRequiredUserId();
            var reqAgente = await context.Agents.AsNoTracking().Select(a => new { a.Id, a.Rol }).FirstOrDefaultAsync(a => a.Id == currentUserId, ct);
            
            if (reqAgente?.Rol != "Admin") 
            {
                logger.LogWarning("Usuario {UserId} intentó modificar bloqueo pero no es Admin en DB.", currentUserId);
                return Results.Forbid();
            }

            var propiedad = await context.Properties.FirstOrDefaultAsync(p => p.Id == id, ct);
            if (propiedad == null) return Results.NotFound();

            logger.LogInformation("Toggle Bloqueo para propiedad {Id}: Bloquear={Bloquear}", id, command.Bloquear);

            propiedad.BloqueoLimpiezaOverride = command.Bloquear;
            
            if (command.Bloquear == false)
            {
                propiedad.FechaProgramadaLimpiezaR2 = null;
            }

            await context.SaveChangesAsync(ct);
            return Results.Ok();
        })
        .RequireAuthorization()
        .WithTags("Propiedades");
    }
}