using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Contactos;

public static class BuscarContactosFeature
{
    public record ContactoBusquedaResponse(Guid Id, string NombreCompleto, string Telefono);

    public static void MapBuscarContactosEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/contactos/buscar", async (string query, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            if (string.IsNullOrWhiteSpace(query))
            {
                return Results.Ok(Enumerable.Empty<ContactoBusquedaResponse>());
            }

            var searchTerm = $"%{query.ToLower()}%";

            var contactos = await context.Contactos
                .Where(l => l.AgenteId == agenteId &&
                           (EF.Functions.ILike(l.Nombre, searchTerm) ||
                            EF.Functions.ILike(l.Apellido ?? "", searchTerm) ||
                            EF.Functions.ILike(l.Telefono, searchTerm)))
                .Take(10)
                .Select(l => new ContactoBusquedaResponse(
                    l.Id,
                    $"{l.Nombre} {l.Apellido}",
                    l.Telefono))
                .ToListAsync();

            return Results.Ok(contactos);
        })
        .RequireAuthorization()
        .WithTags("Contactos")
        .WithName("BuscarContactos");
    }
}
