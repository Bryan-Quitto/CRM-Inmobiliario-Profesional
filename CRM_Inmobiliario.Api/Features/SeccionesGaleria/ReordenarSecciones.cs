using System;
using System.Linq;
using System.Collections.Generic;
using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Features.Propiedades;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.SeccionesGaleria;

public static class ReordenarSeccionesFeature
{
    public record Request(Guid PropiedadId, IEnumerable<Guid> SeccionesIds);

    public static RouteHandlerBuilder MapReordenarSeccionesEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapPut("/propiedades/{propiedadId}/secciones/orden", async (Guid propiedadId, Request request, ClaimsPrincipal user, CrmDbContext context, CancellationToken ct) =>
        {
            if (propiedadId != request.PropiedadId) return Results.BadRequest("ID de propiedad no coincide");

            var currentUserId = user.GetRequiredUserId();
            
            var propiedad = await context.Properties
                .Include(p => p.Agente)
                .Include(p => p.Transactions)
                .FirstOrDefaultAsync(p => p.Id == propiedadId, ct);

            if (propiedad == null) return Results.NotFound();

            if (!PropertyPermissionsHelper.CanManage(propiedad, currentUserId))
            {
                return Results.Forbid();
            }

            var idsSolicitados = request.SeccionesIds.ToList();
            
            try
            {
                // EXPERIMENTO: Bypass total de EF Change Tracking
                // Ejecutamos comandos SQL directos para ver si el pool de Npgsql se comporta mejor
                int totalActualizados = 0;
                for (int i = 0; i < idsSolicitados.Count; i++)
                {
                    var sectionId = idsSolicitados[i];
                    // SQL crudo para actualización directa
                    totalActualizados += await context.Database.ExecuteSqlRawAsync(
                        "UPDATE \"PropertyGallerySections\" SET \"Orden\" = {0} WHERE \"Id\" = {1} AND \"PropiedadId\" = {2}",
                        i, sectionId, propiedadId);
                }

                await context.UpsertAgentPropertyActivityAsync(currentUserId, propiedad.Id, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), ct);

                if (totalActualizados > 0)
                {
                    await context.Properties
                        .Where(p => p.Id == propiedadId)
                        .ExecuteUpdateAsync(s => s.SetProperty(p => p.FechaActualizacion, DateTimeOffset.UtcNow), ct);
                }

                return Results.NoContent();
            }
            catch (Exception ex)
            {
                return Results.Problem("Error en el experimento de reordenamiento: " + ex.Message);
            }
        })
        .WithTags("Propiedades - Galería")
        .WithName("ReordenarSeccionesGaleria")
        .RequireAuthorization();
    }
}
