using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;

namespace CRM_Inmobiliario.Api.Features.Shared.OmniSearch;

public record OmniSearchResult(
    Guid EntityId, 
    string EntityType, 
    string Title, 
    string? Subtitle, 
    string SearchText, 
    Guid VisibleToAgenteId
);

public record OmniSearchResponse(
    IEnumerable<OmniSearchResult> Contactos,
    IEnumerable<OmniSearchResult> Propiedades,
    IEnumerable<OmniSearchResult> Tareas
);

public static class BuscarOmniSearch
{
    public static void MapBuscarOmniSearch(this IEndpointRouteBuilder app)
    {
        app.MapGet("/omnisearch", async (string? query, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();
            if (string.IsNullOrWhiteSpace(query)) return Results.Ok(new OmniSearchResponse([], [], []));

            var searchPattern = $"%{CrmDbContext.NormalizeText(query.Trim())}%";

            // Base query applies strict Tenancy Isolation at the Database level
            var baseQuery = context.OmniSearchResults
                .AsNoTracking()
                .Where(o => o.VisibleToAgenteId == agenteId && EF.Functions.ILike(o.SearchText, searchPattern));

            // Split into 3 queries, limit 5 each
            var contactosQuery = baseQuery.Where(o => o.EntityType == "Contacto").Take(5);
            var propiedadesQuery = baseQuery.Where(o => o.EntityType == "Propiedad").Take(5);
            var tareasQuery = baseQuery.Where(o => o.EntityType == "Tarea").Take(5);

            // Concat forces a single SQL UNION ALL query execution (One Trip Pattern)
            var combinedResults = await contactosQuery
                .Concat(propiedadesQuery)
                .Concat(tareasQuery)
                .ToListAsync();

            // Grouping happens in memory after the one trip
            var response = new OmniSearchResponse(
                combinedResults.Where(r => r.EntityType == "Contacto"),
                combinedResults.Where(r => r.EntityType == "Propiedad"),
                combinedResults.Where(r => r.EntityType == "Tarea")
            );

            return Results.Ok(response);
        })
        .RequireAuthorization()
        .WithTags("OmniSearch")
        .WithName("BuscarOmniSearch");
    }
}
