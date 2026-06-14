using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class BuscarPropiedadesFeature
{
    public record PropiedadBusquedaResponse(Guid Id, string Titulo, string Ciudad, string Sector, Guid? PropietarioId, Guid GestorId, bool AlreadyHasContact = false);

    public static RouteHandlerBuilder MapBuscarPropiedadesEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/propiedades/buscar", async (
            string query,
            Guid? checkContactoId,
            ClaimsPrincipal user,
            CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            string? contactPhoneToShare = null;
            string? cleanPhoneToShare = null;
            if (checkContactoId.HasValue)
            {
                contactPhoneToShare = await context.Contactos
                    .AsNoTracking()
                    .Where(c => c.Id == checkContactoId.Value)
                    .Select(c => c.Telefono)
                    .FirstOrDefaultAsync();
                
                if (contactPhoneToShare != null)
                {
                    cleanPhoneToShare = new string(contactPhoneToShare.Where(char.IsDigit).ToArray());
                }
            }

            if (string.IsNullOrWhiteSpace(query))
            {
                return Results.Ok(Enumerable.Empty<PropiedadBusquedaResponse>());
            }

            var normalizedQuery = query.Trim().ToLower();

            var results = await context.Properties
                .AsNoTracking()
                .Where(p => p.AgenteId == agenteId || p.CreatedByAgenteId == agenteId)
                .Where(p => p.Titulo.ToLower().Contains(normalizedQuery))
                .OrderBy(p => p.Titulo)
                .Take(20)
                .Select(p => new
                {
                    Property = p,
                    GestorId = (p.EsCaptadorActivo && p.AgenteId != null) ? p.AgenteId.Value : p.CreatedByAgenteId ?? Guid.Empty
                })
                .Select(x => new PropiedadBusquedaResponse(
                    x.Property.Id, 
                    x.Property.Titulo, 
                    x.Property.Ciudad, 
                    x.Property.Sector,
                    x.Property.PropietarioId,
                    x.GestorId,
                    false
                ))
                .ToListAsync();

            if (cleanPhoneToShare != null)
            {
                var gestorIds = results.Select(p => p.GestorId).Distinct().ToList();
                var contactosGestores = await context.Contactos
                    .AsNoTracking()
                    .Where(c => gestorIds.Contains(c.AgenteId))
                    .Select(c => new { c.AgenteId, c.Telefono })
                    .ToListAsync();
                    
                foreach(var c in contactosGestores)
                {
                    var cleanContactPhone = string.IsNullOrEmpty(c.Telefono) ? null : new string(c.Telefono.Where(char.IsDigit).ToArray());
                    if (cleanContactPhone != null && cleanContactPhone == cleanPhoneToShare || c.Telefono == contactPhoneToShare)
                    {
                        for (int i = 0; i < results.Count; i++)
                        {
                            if (results[i].GestorId == c.AgenteId)
                            {
                                results[i] = results[i] with { AlreadyHasContact = true };
                            }
                        }
                    }
                }
            }

            return Results.Ok(results);
        })
        .WithTags("Propiedades")
        .WithName("BuscarPropiedades");
    }
}
