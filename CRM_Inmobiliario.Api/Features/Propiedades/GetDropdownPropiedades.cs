using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class GetDropdownPropiedadesFeature
{
    public record DropdownPropiedadResponse(
        Guid Id,
        string Nombre,
        string Referencia);

    public static RouteHandlerBuilder MapGetDropdownPropiedadesEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/propiedades/dropdown", async (string? searchQuery, ClaimsPrincipal user, CrmDbContext context, CancellationToken cancellationToken) =>
        {
            var currentUserId = user.GetRequiredUserId();
            var agenciaIdClaim = user.FindFirst("AgenciaId")?.Value;
            Guid? agenciaId = Guid.TryParse(agenciaIdClaim, out var parsed) ? parsed : null;

            var query = context.Properties
                .AsNoTracking();

            if (agenciaId.HasValue)
            {
                query = query.Where(p => 
                    p.AgenciaId == agenciaId.Value || 
                    p.AgenteId == currentUserId || 
                    (p.Transactions.Any(t => t.CreatedById == currentUserId) && (p.Agente == null || !p.Agente.Activo)));
            }
            else
            {
                query = query.Where(p => 
                    p.AgenteId == currentUserId || 
                    (p.Transactions.Any(t => t.CreatedById == currentUserId) && (p.Agente == null || !p.Agente.Activo)));
            }

            if (!string.IsNullOrWhiteSpace(searchQuery))
            {
                var searchPattern = $"%{searchQuery}%";
                query = query.Where(p => EF.Functions.ILike(
                    EF.Functions.Unaccent(p.Titulo),
                    EF.Functions.Unaccent(searchPattern)));
            }

            var result = await query
                .Select(p => new DropdownPropiedadResponse(
                    p.Id,
                    p.Titulo,
                    !string.IsNullOrEmpty(p.Direccion) ? p.Direccion : p.Ciudad ?? ""
                ))
                .OrderBy(x => x.Nombre)
                .Take(50)
                .ToListAsync(cancellationToken);

            return Results.Ok(result);
        })
        .RequireAuthorization()
        .WithTags("Propiedades")
        .WithName("GetDropdownPropiedades");
    }
}
