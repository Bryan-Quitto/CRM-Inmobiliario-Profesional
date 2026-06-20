using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Contactos;

public static class GetDropdownContactosFeature
{
    public record DropdownContactoResponse(
        Guid Id,
        string Nombre,
        string Referencia,
        string? Apellido,
        string Telefono,
        string EtapaEmbudo,
        bool EsContacto,
        bool EsCompartido);

    public static RouteHandlerBuilder MapGetDropdownContactosEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/contactos/dropdown", async (string? searchQuery, [Microsoft.AspNetCore.Mvc.FromQuery] string contexto, ClaimsPrincipal user, CrmDbContext context, CancellationToken cancellationToken) =>
        {
            var currentUserId = user.GetRequiredUserId();
            Console.WriteLine($"[DEBUG] GetDropdownContactos - currentUserId: {currentUserId}, contexto: {contexto}");

            var query = context.Contactos
                .AsNoTracking();

            if (contexto == "Transaccion")
            {
                query = query.Where(c => c.AgenteId == currentUserId || c.CompartidoCon.Any(cc => cc.AgenteId == currentUserId));
            }
            else
            {
                query = query.Where(c => c.AgenteId == currentUserId);
            }

            query = query.Where(c => !context.AgentArchivedContacts.Any(a => a.AgentId == currentUserId && a.ContactoId == c.Id));

            if (!string.IsNullOrWhiteSpace(searchQuery))
            {
                var searchPattern = $"%{searchQuery}%";
                query = query.Where(c => EF.Functions.ILike(
                    EF.Functions.Unaccent(c.Nombre + " " + (c.Apellido ?? "")),
                    EF.Functions.Unaccent(searchPattern)));
            }

            var tempResult = await query
                .Select(c => new 
                {
                    c.Id,
                    c.Nombre,
                    Referencia = c.AgenteId == currentUserId 
                        ? (string.IsNullOrEmpty(c.Email) ? (c.Telefono ?? "") : c.Email)
                        : (c.Agente != null ? "Compartido por " + c.Agente.Nombre : "Compartido"),
                    c.AgenteId,
                    c.Apellido,
                    c.Telefono,
                    c.EtapaEmbudo,
                    c.EsProspecto
                })
                .OrderBy(x => x.Nombre + " " + (x.Apellido ?? ""))
                .Take(50)
                .ToListAsync(cancellationToken);


            var result = tempResult.Select(x => new DropdownContactoResponse(
                x.Id, 
                x.Nombre, 
                x.Referencia,
                x.Apellido,
                x.Telefono ?? "",
                x.EtapaEmbudo ?? "Nuevo",
                x.EsProspecto,
                x.AgenteId != currentUserId
            )).ToList();

            return Results.Ok(result);
        })
        .RequireAuthorization()
        .WithTags("Contactos")
        .WithName("GetDropdownContactos");
    }
}
