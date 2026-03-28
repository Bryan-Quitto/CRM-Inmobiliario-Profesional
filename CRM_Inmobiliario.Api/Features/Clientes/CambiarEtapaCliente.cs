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
        app.MapPatch("/api/clientes/{id:guid}/etapa", async (Guid id, Command command, CrmDbContext context) =>
        {
            try 
            {
                var lead = await context.Leads.FirstOrDefaultAsync(l => l.Id == id);

                if (lead is null)
                {
                    return Results.NotFound(new { Message = $"No se encontró el prospecto con ID: {id}" });
                }

                // Validación básica de etapa permitida
                var etapasPermitidas = new[] { "Nuevo", "Contactado", "En Negociación", "Cerrado", "Perdido" };
                if (!etapasPermitidas.Contains(command.NuevaEtapa))
                {
                    return Results.BadRequest(new { Message = $"La etapa '{command.NuevaEtapa}' no es válida." });
                }

                lead.EtapaEmbudo = command.NuevaEtapa;
                await context.SaveChangesAsync();

                return Results.NoContent();
            }
            catch (Exception)
            {
                return Results.Problem("Ocurrió un error interno al procesar la actualización.");
            }
        })
        .WithTags("Clientes")
        .WithName("CambiarEtapaCliente");
    }
}
