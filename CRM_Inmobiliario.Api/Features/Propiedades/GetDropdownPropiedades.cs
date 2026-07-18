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
        string Referencia,
        bool? BloqueoAdministrativo);

    public static RouteHandlerBuilder MapGetDropdownPropiedadesEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/propiedades/dropdown", async (string? searchQuery, ClaimsPrincipal user, CrmDbContext context, CancellationToken cancellationToken) =>
        {
            var currentUserId = user.GetRequiredUserId();
            var reqAgente = await context.Agents.AsNoTracking().Select(a => new { a.Id, a.Rol, a.AgenciaId }).FirstOrDefaultAsync(a => a.Id == currentUserId, cancellationToken);
            
            var isAdmin = reqAgente?.Rol == "Admin";
            Guid? agenciaId = reqAgente?.AgenciaId;

            var query = context.Properties
                .AsNoTracking();

            Console.WriteLine($"[DEBUG-DROPDOWN] Total en BD: {await query.CountAsync(cancellationToken)}");
            Console.WriteLine($"[DEBUG-DROPDOWN] currentUserId: {currentUserId}, isAdmin: {isAdmin}");

            if (!isAdmin)
            {
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
            }

            Console.WriteLine($"[DEBUG-DROPDOWN] Total tras filtro tenencia: {await query.CountAsync(cancellationToken)}");

            query = query.Where(p => !context.AgentArchivedProperties.Any(a => a.AgentId == currentUserId && a.PropiedadId == p.Id));
            
            Console.WriteLine($"[DEBUG-DROPDOWN] Total tras ignorar archivados: {await query.CountAsync(cancellationToken)}");

            if (!string.IsNullOrWhiteSpace(searchQuery))
            {
                var searchPattern = $"%{searchQuery}%";
                query = query.Where(p => EF.Functions.ILike(
                    EF.Functions.Unaccent(p.Titulo),
                    EF.Functions.Unaccent(searchPattern)) || 
                    EF.Functions.ILike(p.CodigoCorto, searchPattern));
            }

            Console.WriteLine($"[DEBUG-DROPDOWN] Total tras filtro de búsqueda ('{searchQuery}'): {await query.CountAsync(cancellationToken)}");

            var result = await query
                .OrderBy(p => p.Titulo)
                .Select(p => new DropdownPropiedadResponse(
                    p.Id,
                    p.Titulo,
                    !string.IsNullOrEmpty(p.Direccion) ? p.Direccion : p.Ciudad ?? "",
                    isAdmin ? p.BloqueoAdministrativo : null
                ))
                .Take(50)
                .ToListAsync(cancellationToken);

            return Results.Ok(result);
        })
        .RequireAuthorization()
        .WithTags("Propiedades")
        .WithName("GetDropdownPropiedades");
    }
}
