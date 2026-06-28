using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class ListarPropiedadesFeature
{
    public static RouteHandlerBuilder MapListarPropiedadesEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/propiedades", async ([AsParameters] GetPropiedadesRequest request, ClaimsPrincipal user, CrmDbContext context, IServiceProvider serviceProvider, CancellationToken cancellationToken) =>
        {
            var actualPageNumber = request.PageNumber ?? 1;
            var actualPageSize = request.PageSize ?? 50;

            var currentUserId = user.GetRequiredUserId();

            string? contactPhoneToShare = null;
            string? cleanPhoneToShare = null;
            if (request.CheckContactoId.HasValue)
            {
                contactPhoneToShare = await context.Contactos
                    .AsNoTracking()
                    .Where(c => c.Id == request.CheckContactoId.Value)
                    .Select(c => c.Telefono)
                    .FirstOrDefaultAsync();

                if (contactPhoneToShare != null)
                {
                    cleanPhoneToShare = new string(contactPhoneToShare.Where(char.IsDigit).ToArray());
                }
            }

            // Obtenemos la agencia del agente actual primero
            var agenciaId = await context.Agents
                .AsNoTracking()
                .Where(a => a.Id == currentUserId)
                .Select(a => a.AgenciaId)
                .FirstOrDefaultAsync();

            var query = ListarPropiedadesQueryBuilder.BuildPermissionsQuery(context, currentUserId, agenciaId, request.IsArchived);
            query = ListarPropiedadesQueryBuilder.ApplyFilters(query, request);

            var memCache = serviceProvider.GetRequiredService<IMemoryCache>();
            var counts = await ListarPropiedadesCountsHelper.GetCountsAsync(memCache, query, currentUserId, agenciaId, request, cancellationToken);

            query = ListarPropiedadesQueryBuilder.ApplySorting(query, request.SortBy, request.SortDirection);

            var propiedades = await query
                .Skip((actualPageNumber - 1) * actualPageSize)
                .Take(actualPageSize)
                .Select(p => new
                {
                    Property = p,
                    ActiveTransaction = p.Transactions
                        .Where(t => t.TransactionStatus == "Active")
                        .OrderByDescending(t => t.TransactionDate)
                        .Select(t => new ActiveTransactionInfo(
                            t.CreatedById,
                            t.CreatedBy != null ? t.CreatedBy.Nombre + " " + t.CreatedBy.Apellido : "Agente desconocido"))
                        .FirstOrDefault()
                })
                .Select(x => new Response(
                    x.Property.Id,
                    x.Property.Titulo,
                    x.Property.TipoPropiedad,
                    x.Property.Operacion,
                    x.Property.Precio,
                    x.Property.Sector,
                    x.Property.Ciudad,
                    x.Property.EstadoComercial,
                    x.Property.EsCaptacionPropia,
                    x.Property.AgenteId == currentUserId ? x.Property.PorcentajeComision : 0m,
                    x.Property.Agente != null ? x.Property.Agente.Nombre + " " + x.Property.Agente.Apellido : string.Empty,
                    (x.Property.EsCaptadorActivo && x.Property.AgenteId != null) ? x.Property.AgenteId.Value : x.Property.CreatedByAgenteId ?? Guid.Empty,
                    (x.Property.EsCaptadorActivo && x.Property.Agente != null) ? x.Property.Agente.Nombre + " " + x.Property.Agente.Apellido : (x.Property.CreatedByAgente != null ? x.Property.CreatedByAgente.Nombre + " " + x.Property.CreatedByAgente.Apellido : "Agente desconocido"),
                    x.Property.AgenteId == currentUserId ? x.Property.PropietarioId : null,
                    x.Property.AgenteId == currentUserId || (x.Property.CerradoCon != null && x.Property.CerradoCon.AgenteId == currentUserId) ? x.Property.CerradoConId : null,
                    x.Property.AgenteId == currentUserId || (x.Property.CerradoCon != null && x.Property.CerradoCon.AgenteId == currentUserId) 
                        ? (x.Property.CerradoCon != null ? x.Property.CerradoCon.Nombre + " " + x.Property.CerradoCon.Apellido : null) 
                        : "Oculto (Privacidad del Inversionista)",
                    x.Property.Media
                        .Where(m => m.EsPrincipal)
                        .OrderBy(m => m.Id)
                        .Select(m => m.UrlPublica)
                        .FirstOrDefault(),
                    x.Property.FechaIngreso,
                    new PropertyPermissions(
                        x.Property.AgenteId == currentUserId || (x.Property.Transactions.Any(t => t.CreatedById == currentUserId) && (x.Property.Agente == null || !x.Property.Agente.Activo)),
                        x.Property.AgenteId == currentUserId || (x.Property.Transactions.Any(t => t.CreatedById == currentUserId) && (x.Property.Agente == null || !x.Property.Agente.Activo))
                    ),
                    x.ActiveTransaction,
                    x.Property.Version.ToString(),
                    x.Property.Habitaciones,
                    x.Property.AreaTotal,
                    x.Property.AniosAntiguedad,
                    false,
                    request.IsArchived)) 
                .ToListAsync(cancellationToken);

            if (cleanPhoneToShare != null)
            {
                var gestorIds = propiedades.Select(p => p.GestorId).Distinct().ToList();
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
                        for (int i = 0; i < propiedades.Count; i++)
                        {
                            if (propiedades[i].GestorId == c.AgenteId)
                            {
                                propiedades[i] = propiedades[i] with { AlreadyHasContact = true };
                            }
                        }
                    }
                }
            }

            return Results.Ok(new 
            {
                Items = propiedades,
                TotalCount = counts.TotalCount,
                CountVentas = counts.CountVentas,
                CountAlquiler = counts.CountAlquiler,
                PageNumber = actualPageNumber,
                PageSize = actualPageSize
            });
        })
        .WithTags("Propiedades")
        .WithName("ListarPropiedades");
    }
}
