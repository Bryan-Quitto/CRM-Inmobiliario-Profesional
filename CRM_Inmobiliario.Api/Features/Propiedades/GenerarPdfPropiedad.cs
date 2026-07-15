using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.BackgroundServices;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class GenerarPdfPropiedadFeature
{
    public static RouteHandlerBuilder MapGenerarPdfPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapPost("/propiedades/{id:guid}/generar-pdf", async (Guid id, ClaimsPrincipal user, CrmDbContext context, IPdfGeneratorQueue pdfQueue) =>
        {
            var currentUserId = user.GetRequiredUserId();
            
            var reqAgente = await context.Agents.AsNoTracking().FirstOrDefaultAsync(a => a.Id == currentUserId);
            if (reqAgente == null) return Results.Forbid();

            // Validar que la propiedad exista y el usuario tenga acceso a ella (sea de la misma agencia)
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

            // Encolar la generación asíncrona
            await pdfQueue.QueuePdfGenerationAsync(new PdfGenerationRequest(id, currentUserId));

            return Results.Ok();
        })
        .WithTags("Propiedades")
        .WithName("GenerarPdfPropiedad")
        .AddEndpointFilter<CRM_Inmobiliario.Api.Infrastructure.Security.SecurityTelemetryFilter>();
    }
}