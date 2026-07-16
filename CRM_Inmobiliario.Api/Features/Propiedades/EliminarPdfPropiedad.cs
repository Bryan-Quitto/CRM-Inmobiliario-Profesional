using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Infrastructure.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class EliminarPdfPropiedadFeature
{
    public static RouteHandlerBuilder MapEliminarPdfPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapDelete("/propiedades/{id:guid}/pdf", async (Guid id, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var currentUserId = user.GetRequiredUserId();
            
            var reqAgente = await context.Agents.AsNoTracking().FirstOrDefaultAsync(a => a.Id == currentUserId);
            if (reqAgente == null) return Results.Forbid();

            var propiedad = await context.Properties
                .AsNoTracking()
                .Include(p => p.Agente)
                .FirstOrDefaultAsync(p => p.Id == id);
            
            if (propiedad == null)
            {
                return Results.NotFound();
            }

            var hasAccess = reqAgente.Rol == "Admin" || (propiedad.AgenciaId != null && propiedad.AgenciaId == reqAgente.AgenciaId);
            if (!hasAccess)
            {
                return Results.Forbid();
            }

            var fileName = $"ficha_{id}_{currentUserId}.pdf";
            var key = $"propiedades/{id}/{fileName}";
            
            await context.QueueStorageDeletionWithQuotaLiberationAsync(key, currentUserId);

            return Results.Ok(new { message = "PDF eliminado exitosamente" });
        })
        .WithTags("Propiedades")
        .WithName("EliminarPdfPropiedad")
        .AddEndpointFilter<CRM_Inmobiliario.Api.Infrastructure.Security.SecurityTelemetryFilter>();
    }
}