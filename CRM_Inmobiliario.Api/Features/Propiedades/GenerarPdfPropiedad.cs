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

            if (propiedad.BloqueoAdministrativo == true)
            {
                return Results.Problem(detail: "La propiedad ha sido bloqueada administrativamente y no puede generar PDFs.", statusCode: StatusCodes.Status403Forbidden);
            }

            var year = DateTime.UtcNow.Year;
            var month = DateTime.UtcNow.Month;
            var agentUsage = await context.AgentStorageUsages
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.AgentId == currentUserId && u.Year == year && u.Month == month);
            long currentMonthBytesUsed = agentUsage?.TotalBytesUploaded ?? 0;

            if (currentMonthBytesUsed >= reqAgente.MonthlyStorageBytesLimit || reqAgente.GlobalStorageBytesUsed >= reqAgente.GlobalStorageBytesLimit)
            {
                return Results.Problem(detail: "Límite de almacenamiento alcanzado. Para más información revise su panel de inicio.", statusCode: StatusCodes.Status400BadRequest);
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