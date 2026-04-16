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
        app.MapPost("/clientes/{clienteId:guid}/intereses", async (Guid clienteId, Request request, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, ILogger<Request> logger, CancellationToken ct) =>
        {
            var sw = System.Diagnostics.Stopwatch.StartNew();
            var agenteId = user.GetRequiredUserId();

            // 1. Obtener toda la información necesaria en UN SOLO round-trip y validar pertenencia
            var data = await context.Leads
                .Where(l => l.Id == clienteId && l.AgenteId == agenteId)
                .Select(l => new
                {
                    ClienteExiste = true,
                    PropiedadExiste = context.Properties.Any(p => p.Id == request.PropiedadId && p.AgenteId == agenteId),
                    InteresExistente = context.LeadPropertyInterests
                        .FirstOrDefault(i => i.ClienteId == clienteId && i.PropiedadId == request.PropiedadId)
                })
                .FirstOrDefaultAsync(ct);

            if (data is null) return Results.NotFound("Cliente no encontrado o no te pertenece.");
            if (!data.PropiedadExiste) return Results.NotFound("Propiedad no encontrada o no te pertenece.");

            // 2. Validar nivel de interés
            var nivelesValidos = new[] { "Alto", "Medio", "Bajo", "Descartada" };
            if (!nivelesValidos.Contains(request.NivelInteres))
            {
                return Results.BadRequest($"Nivel de interés no válido. Debe ser uno de: {string.Join(", ", nivelesValidos)}");
            }

            // 3. Aplicar cambios (Upsert)
            // 3. Aplicar cambios
            if (data.InteresExistente is not null)
            {
                // Hacemos el UPDATE directo a SQL saltando la carga de memoria (Zero Tracking)
                await context.LeadPropertyInterests
                    .Where(i => i.ClienteId == clienteId && i.PropiedadId == request.PropiedadId)
                    .ExecuteUpdateAsync(s => s
                        .SetProperty(i => i.NivelInteres, request.NivelInteres)
                        .SetProperty(i => i.FechaRegistro, DateTimeOffset.UtcNow), ct);
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
                await context.SaveChangesAsync(ct);
            }

            // Invalidar caches proactivamente (Afecta dashboard y analítica)
            await cacheStore.EvictByTagAsync("dashboard-data", ct);
            await cacheStore.EvictByTagAsync("analytics-data", ct);
            
            sw.Stop();
            logger.LogInformation("VincularPropiedad finalizada en {ElapsedMilliseconds} ms (Cliente: {ClienteId}, Propiedad: {PropiedadId})", sw.ElapsedMilliseconds, clienteId, request.PropiedadId);

            return Results.Ok();
        })
        .WithTags("Intereses")
        .WithName("VincularPropiedad");
    }
}
