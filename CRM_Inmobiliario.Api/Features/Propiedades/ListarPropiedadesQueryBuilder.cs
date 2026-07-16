using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class ListarPropiedadesQueryBuilder
{
    public static IQueryable<Property> BuildPermissionsQuery(
        CrmDbContext context, 
        Guid currentUserId, 
        Guid? agenciaId, 
        bool isArchived)
    {
        var query = context.Properties.AsNoTracking();

        if (agenciaId.HasValue)
        {
            query = query.Where(p => p.AgenciaId == agenciaId || 
                                   p.AgenteId == currentUserId || 
                                   (p.Transactions.Any(t => t.CreatedById == currentUserId) && (p.Agente == null || !p.Agente.Activo)));
        }
        else
        {
            query = query.Where(p => p.AgenteId == currentUserId || 
                                   (p.Transactions.Any(t => t.CreatedById == currentUserId) && (p.Agente == null || !p.Agente.Activo)));
        }

        var archivedQuery = context.AgentArchivedProperties.Where(a => a.AgentId == currentUserId);

        if (isArchived)
        {
            query = query.Where(p => archivedQuery.Any(a => a.PropiedadId == p.Id));
        }
        else
        {
            query = query.Where(p => !archivedQuery.Any(a => a.PropiedadId == p.Id));
        }

        return query;
    }

    public static IQueryable<Property> ApplyFilters(CrmDbContext context, IQueryable<Property> query, GetPropiedadesRequest request)
    {
        if (!string.IsNullOrWhiteSpace(request.SearchQuery))
        {
            var searchString = CrmDbContext.NormalizeText(request.SearchQuery);
            if (context.Database.ProviderName == "Microsoft.EntityFrameworkCore.InMemory")
            {
                query = query.Where(p => p.NormalizedSearchText != null && p.NormalizedSearchText.Contains(searchString));
            }
            else
            {
                var searchPattern = $"%{searchString}%";
                query = query.Where(p => EF.Functions.ILike(p.NormalizedSearchText, searchPattern));
            }
        }

        if (!string.IsNullOrWhiteSpace(request.EstadoComercial) && request.EstadoComercial != "Todos")
        {
            if (request.EstadoComercial == "Por limpiar")
            {
                var limite31Dias = DateTimeOffset.UtcNow.AddYears(-1).AddDays(31);
                query = query.Where(p => p.FechaProgramadaLimpiezaR2 != null || 
                    ((p.EstadoComercial == "Vendida" || p.EstadoComercial == "Alquilada") && 
                     p.FechaCierre != null && 
                     p.FechaCierre <= limite31Dias && 
                     (p.Media.Any(m => !m.EsPrincipal) || p.GallerySections.Any()) && 
                     p.BloqueoLimpiezaOverride != false));
            }
            else
            {
                query = query.Where(p => p.EstadoComercial == request.EstadoComercial);
            }
        }

        if (!string.IsNullOrWhiteSpace(request.TipoPropiedad) && request.TipoPropiedad != "Todos")
            query = query.Where(p => p.TipoPropiedad == request.TipoPropiedad);

        if (!string.IsNullOrWhiteSpace(request.Operacion) && request.Operacion != "Todas")
            query = query.Where(p => p.Operacion == request.Operacion);

        if (request.PrecioMin.HasValue)
            query = query.Where(p => p.Precio >= request.PrecioMin.Value);
        if (request.PrecioMax.HasValue)
            query = query.Where(p => p.Precio <= request.PrecioMax.Value);

        if (request.AreaTotalMin.HasValue)
            query = query.Where(p => p.AreaTotal >= request.AreaTotalMin.Value);
        if (request.AreaTotalMax.HasValue)
            query = query.Where(p => p.AreaTotal <= request.AreaTotalMax.Value);

        if (request.HabitacionesMin.HasValue)
            query = query.Where(p => p.Habitaciones >= request.HabitacionesMin.Value);
        if (request.HabitacionesMax.HasValue)
            query = query.Where(p => p.Habitaciones <= request.HabitacionesMax.Value);

        if (request.AniosAntiguedadMin.HasValue)
            query = query.Where(p => p.AniosAntiguedad >= request.AniosAntiguedadMin.Value);
        if (request.AniosAntiguedadMax.HasValue)
            query = query.Where(p => p.AniosAntiguedad <= request.AniosAntiguedadMax.Value);

        if (request.EsCaptacionPropia.HasValue)
            query = query.Where(p => p.EsCaptacionPropia == request.EsCaptacionPropia.Value);

        return query;
    }

    public static IQueryable<Property> ApplySorting(IQueryable<Property> query, string? sortBy, string? sortDirection)
    {
        var sortByLower = sortBy?.ToLowerInvariant() ?? "fechaingreso";
        var isAsc = (sortDirection?.ToLowerInvariant() ?? "desc") == "asc";

        return sortByLower switch
        {
            "precio" => isAsc ? query.OrderBy(p => p.Precio).ThenBy(p => p.Id) : query.OrderByDescending(p => p.Precio).ThenByDescending(p => p.Id),
            "areatotal" => isAsc ? query.OrderBy(p => p.AreaTotal).ThenBy(p => p.Id) : query.OrderByDescending(p => p.AreaTotal).ThenByDescending(p => p.Id),
            "habitaciones" => isAsc ? query.OrderBy(p => p.Habitaciones).ThenBy(p => p.Id) : query.OrderByDescending(p => p.Habitaciones).ThenByDescending(p => p.Id),
            "aniosantiguedad" => isAsc ? query.OrderBy(p => p.AniosAntiguedad).ThenBy(p => p.Id) : query.OrderByDescending(p => p.AniosAntiguedad).ThenByDescending(p => p.Id),
            _ => isAsc ? query.OrderBy(p => p.FechaIngreso).ThenBy(p => p.Id) : query.OrderByDescending(p => p.FechaIngreso).ThenByDescending(p => p.Id)
        };
    }
}
