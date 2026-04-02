using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Clientes;

public static class CambiarEtapaClienteFeature
{
    public record Command(string NuevaEtapa);

    public static void MapCambiarEtapaClienteEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPatch("/clientes/{id:guid}/etapa", async (Guid id, Command command, CrmDbContext context) =>
        {
            // Validación básica de etapa permitida
            var etapasPermitidas = new[] { "Nuevo", "Contactado", "En Negociación", "Cerrado", "Perdido" };
            if (!etapasPermitidas.Contains(command.NuevaEtapa))
            {
                return Results.BadRequest(new { Message = $"La etapa '{command.NuevaEtapa}' no es válida." });
            }

            var rowsAffected = await context.Leads
                .Where(l => l.Id == id)
                .ExecuteUpdateAsync(setters => setters.SetProperty(l => l.EtapaEmbudo, command.NuevaEtapa));

            return rowsAffected > 0 
                ? Results.NoContent() 
                : Results.NotFound(new { Message = $"No se encontró el prospecto con ID: {id}" });
        })
        .WithTags("Clientes")
        .WithName("CambiarEtapaCliente");
    }
}
