using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Faqs;

public static class ListarFaqsFeature
{
    public record FaqResponse(
        Guid Id,
        Guid PropiedadId,
        string Pregunta,
        string Respuesta,
        string Estado,
        string? NotaRechazo,
        Guid CreadoPorAgenteId,
        string NombreCreador,
        DateTimeOffset FechaCreacion,
        DateTimeOffset FechaActualizacion);

    public static RouteHandlerBuilder MapListarFaqsEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/propiedades/{propiedadId:guid}/faqs", async (
            Guid propiedadId,
            ClaimsPrincipal user,
            CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();
            var userRole = user.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

            var propiedad = await context.Properties
                .Include(p => p.Agente)
                .Include(p => p.Transactions)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == propiedadId);

            if (propiedad is null) return Results.NotFound("Propiedad no encontrada.");

            var puedeGestionar = Propiedades.PropertyPermissionsHelper.CanManageFaq(propiedad, agenteId, userRole);

            var query = context.PropertyFaqs
                .AsNoTracking()
                .Where(f => f.PropiedadId == propiedadId);

            if (!puedeGestionar)
                query = query.Where(f => f.CreadoPorAgenteId == agenteId || f.Estado == "Aprobada");

            var faqs = await query
                .OrderBy(f => f.FechaCreacion)
                .Select(f => new FaqResponse(
                    f.Id,
                    f.PropiedadId,
                    f.Pregunta,
                    f.Respuesta,
                    f.Estado,
                    f.NotaRechazo,
                    f.CreadoPorAgenteId,
                    f.CreadoPorAgente.Nombre + " " + f.CreadoPorAgente.Apellido,
                    f.FechaCreacion,
                    f.FechaActualizacion))
                .ToListAsync();

            return Results.Ok(faqs);
        })
        .WithTags("FAQs")
        .WithName("ListarFaqs");
    }
}
