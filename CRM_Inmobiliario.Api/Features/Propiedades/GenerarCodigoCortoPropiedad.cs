using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NanoidDotNet;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class GenerarCodigoCortoPropiedadFeature
{
    public static void MapGenerarCodigoCortoPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/propiedades/{id:guid}/generar-codigo", async (Guid id, ClaimsPrincipal user, CrmDbContext context, ILogger<CrmDbContext> logger, CancellationToken ct) =>
        {
            logger.LogInformation("Generando código corto para propiedad: {Id}", id);
            var currentUserId = user.GetRequiredUserId();
            var propiedad = await context.Properties
                .Include(p => p.Agente)
                .FirstOrDefaultAsync(p => p.Id == id, ct);

            if (propiedad is null)
            {
                logger.LogWarning("Propiedad {Id} no encontrada", id);
                return Results.NotFound();
            }

            if (!PropertyPermissionsHelper.CanManage(propiedad, currentUserId, false))
            {
                logger.LogWarning("Usuario {UserId} no tiene permisos para propiedad {Id}", currentUserId, id);
                return Results.Json(new { message = "No tienes permisos para editar esta propiedad." }, statusCode: StatusCodes.Status403Forbidden);
            }

            if (!string.IsNullOrWhiteSpace(propiedad.CodigoCorto))
            {
                logger.LogWarning("Propiedad {Id} ya tiene código corto: '{Codigo}'", id, propiedad.CodigoCorto);
                return Results.BadRequest(new { message = "La propiedad ya tiene un código corto asignado." });
            }

            var nanoId = await Nanoid.GenerateAsync("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 5);
            propiedad.CodigoCorto = $"PRO-{nanoId}";

            await context.SaveChangesAsync(ct);
            
            return Results.Ok(new { CodigoCorto = propiedad.CodigoCorto });
        })
        .WithTags("Propiedades")
        .WithName("GenerarCodigoCortoPropiedad");
    }
}
