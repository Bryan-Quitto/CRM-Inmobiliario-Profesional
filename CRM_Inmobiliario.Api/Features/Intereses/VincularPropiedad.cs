using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Intereses;

public static class VincularPropiedadFeature
{
    public record Request(Guid PropiedadId, string NivelInteres);

    public static void MapVincularPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/clientes/{clienteId:guid}/intereses", async (Guid clienteId, Request request, CrmDbContext context) =>
        {
            // 1. Obtener toda la información necesaria en UN SOLO round-trip
            var data = await context.Leads
                .Where(l => l.Id == clienteId)
                .Select(l => new
                {
                    ClienteExiste = true,
                    PropiedadExiste = context.Properties.Any(p => p.Id == request.PropiedadId),
                    InteresExistente = context.LeadPropertyInterests
                        .FirstOrDefault(i => i.ClienteId == clienteId && i.PropiedadId == request.PropiedadId)
                })
                .FirstOrDefaultAsync();

            if (data is null) return Results.NotFound("Cliente no encontrado.");
            if (!data.PropiedadExiste) return Results.NotFound("Propiedad no encontrada.");

            // 2. Validar nivel de interés
            var nivelesValidos = new[] { "Alto", "Medio", "Bajo", "Descartada" };
            if (!nivelesValidos.Contains(request.NivelInteres))
            {
                return Results.BadRequest($"Nivel de interés no válido. Debe ser uno de: {string.Join(", ", nivelesValidos)}");
            }

            // 3. Aplicar cambios (Upsert)
            var interesExistente = await context.LeadPropertyInterests
                .FirstOrDefaultAsync(i => i.ClienteId == clienteId && i.PropiedadId == request.PropiedadId);

            if (interesExistente is not null)
            {
                interesExistente.NivelInteres = request.NivelInteres;
                interesExistente.FechaRegistro = DateTimeOffset.UtcNow;
            }
            else
            {
                var nuevoInteres = new LeadPropertyInterest
                {
                    ClienteId = clienteId,
                    PropiedadId = request.PropiedadId,
                    NivelInteres = request.NivelInteres,
                    FechaRegistro = DateTimeOffset.UtcNow
                };
                context.LeadPropertyInterests.Add(nuevoInteres);
            }

            await context.SaveChangesAsync();

            return Results.Ok();
        })
        .WithTags("Intereses")
        .WithName("VincularPropiedad");
    }
}
