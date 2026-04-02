using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class CambiarEstadoPropiedadFeature
{
    public record Command(string NuevoEstado);

    public static void MapCambiarEstadoPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPatch("/propiedades/{id:guid}/estado", async (Guid id, Command command, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            var fechaCierre = command.NuevoEstado is "Vendida" or "Alquilada" 
                ? (DateTimeOffset?)DateTimeOffset.UtcNow 
                : null;

            var rowsAffected = await context.Properties
                .Where(p => p.Id == id && p.AgenteId == agenteId)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(p => p.EstadoComercial, command.NuevoEstado)
                    .SetProperty(p => p.FechaCierre, fechaCierre));

            return rowsAffected > 0 
                ? Results.NoContent() 
                : Results.NotFound(new { Message = "La propiedad no existe o no tiene permisos." });
        })
        .WithTags("Propiedades")
        .WithName("CambiarEstadoPropiedad");
    }
}
