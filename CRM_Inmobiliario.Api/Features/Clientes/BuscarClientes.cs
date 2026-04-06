using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Clientes;

public static class BuscarClientesFeature
{
    public record ClienteBusquedaResponse(Guid Id, string NombreCompleto, string Telefono);

    public static void MapBuscarClientesEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/clientes/buscar", async (string query, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            if (string.IsNullOrWhiteSpace(query))
            {
                return Results.Ok(Enumerable.Empty<ClienteBusquedaResponse>());
            }

            var normalizedQuery = query.Trim().ToLower();

            // Búsqueda inteligente de teléfono: removemos caracteres no numéricos para comparar
            var digitsOnly = new string(query.Where(char.IsDigit).ToArray());

            var clientes = await context.Leads
                .AsNoTracking()
                .Where(l => l.AgenteId == agenteId)
                .Where(l => 
                    l.Nombre.ToLower().Contains(normalizedQuery) || 
                    (l.Apellido != null && l.Apellido.ToLower().Contains(normalizedQuery)) ||
                    l.Telefono.Contains(normalizedQuery) ||
                    (digitsOnly.Length > 0 && l.Telefono.Replace("+", "").Contains(digitsOnly))
                )
                .OrderBy(l => l.Nombre)
                .Take(20)
                .Select(l => new ClienteBusquedaResponse(
                    l.Id, 
                    $"{l.Nombre} {l.Apellido}".Trim(), 
                    l.Telefono))
                .ToListAsync();

            return Results.Ok(clientes);
        })
        .WithTags("Clientes")
        .WithName("BuscarClientes");
    }
}
