using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.Intereses;

public static class VincularPropiedadFeature
{
    public record Request(Guid PropiedadId, string NivelInteres);

    public static void MapVincularPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/contactos/{contactoId:guid}/intereses", async (Guid contactoId, Request request, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, ILogger<Request> logger, CancellationToken ct) =>
        {
            var sw = System.Diagnostics.Stopwatch.StartNew();
            var agenteId = user.GetRequiredUserId();

            // 1. Obtener toda la información necesaria en UN SOLO round-trip y validar pertenencia
            var data = await context.Contactos
                .Where(l => l.Id == contactoId && l.AgenteId == agenteId)
                .Select(l => new
                {
                    ContactoExiste = true,
                    PropiedadExiste = context.Properties.Any(p => p.Id == request.PropiedadId && p.AgenteId == agenteId),
                    InteresExistente = context.ContactoInteresPropiedades
                        .FirstOrDefault(i => i.ContactoId == contactoId && i.PropiedadId == request.PropiedadId)
                })
                .FirstOrDefaultAsync(ct);

            if (data is null) return Results.NotFound("Contacto no encontrado o no te pertenece.");
            if (!data.PropiedadExiste) return Results.NotFound("Propiedad no encontrada o no te pertenece.");

            // 2. Validar nivel de interés
            var nivelesValidos = new[] { "Alto", "Medio", "Bajo", "Descartada" };
            if (!nivelesValidos.Contains(request.NivelInteres))
            {
                return Results.BadRequest($"Nivel de interés no válido. Debe ser uno de: {string.Join(", ", nivelesValidos)}");
            }

            // 3. Aplicar cambios (Upsert)
            if (data.InteresExistente is not null)
            {
                // Hacemos el UPDATE directo a SQL saltando la carga de memoria (Zero Tracking)
                await context.ContactoInteresPropiedades
                    .Where(i => i.ContactoId == contactoId && i.PropiedadId == request.PropiedadId)
                    .ExecuteUpdateAsync(s => s
                        .SetProperty(i => i.NivelInteres, request.NivelInteres)
                        .SetProperty(i => i.FechaRegistro, DateTimeOffset.UtcNow), ct);
            }
            else
            {
                var nuevoInteres = new ContactoInteresPropiedad
                {
                    ContactoId = contactoId,
                    PropiedadId = request.PropiedadId,
                    NivelInteres = request.NivelInteres,
                    FechaRegistro = DateTimeOffset.UtcNow
                };
                context.ContactoInteresPropiedades.Add(nuevoInteres);
                await context.SaveChangesAsync(ct);
            }

            // Invalidar caches proactivamente (Afecta dashboard y analítica)
            await cacheStore.EvictByTagAsync("dashboard-data", ct);
            await cacheStore.EvictByTagAsync("analytics-data", ct);
            
            sw.Stop();
            logger.LogInformation("VincularPropiedad finalizada en {ElapsedMilliseconds} ms (Contacto: {ContactoId}, Propiedad: {PropiedadId})", sw.ElapsedMilliseconds, contactoId, request.PropiedadId);

            return Results.Ok();
        })
        .WithTags("Intereses")
        .WithName("VincularPropiedad");
    }
}
