using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Infrastructure.BackgroundServices;
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
        return app.MapPut("/propiedades/{propiedadId}/secciones/orden", async (Guid propiedadId, Request request, ClaimsPrincipal user, CrmDbContext context, IPdfGeneratorQueue pdfQueue) =>
        {
            if (propiedadId != request.PropiedadId) return Results.BadRequest("ID de propiedad no coincide");

            var agenteId = user.GetRequiredUserId();
            
            // Consolidar verificación de propiedad y carga de IDs de secciones en una sola llamada
            var propiedadData = await context.Properties
                .Where(p => p.Id == propiedadId && p.AgenteId == agenteId)
                .Select(p => new {
                    Existe = true,
                    SeccionesIds = p.GallerySections.Select(s => s.Id).ToList()
                })
                .FirstOrDefaultAsync();

            if (propiedadData == null) return Results.Forbid();

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

                await pdfQueue.QueuePdfGenerationAsync(propiedadId);

                Console.WriteLine($"DEBUG [ReordenarSecciones]: SQL Directo ejecutado. Secciones afectadas: {totalActualizados}");
                return Results.NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR [ReordenarSecciones]: Error en SQL Directo -> {ex.Message}");
                if (ex.InnerException != null) 
                    Console.WriteLine($"INNER ERROR: {ex.InnerException.Message}");
                
                return Results.Problem("Error en el experimento de reordenamiento: " + ex.Message);
            }
        })
        .WithTags("Propiedades - Galería")
        .WithName("ReordenarSeccionesGaleria");
    }
}
