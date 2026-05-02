using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.OutputCaching;

namespace CRM_Inmobiliario.Api.Features.Interacciones;

public static class RegistrarInteraccionFeature
{
    public record Command(
        Guid ContactoId,
        string TipoInteraccion,
        string Notas);

    public record Response(
        Guid Id,
        Guid ContactoId,
        string TipoInteraccion,
        string Notas,
        DateTimeOffset FechaInteraccion);

    public static void MapRegistrarInteraccionEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/interacciones", async (Command command, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();

            var contacto = await context.Contactos
                .FirstOrDefaultAsync(l => l.Id == command.ContactoId && l.AgenteId == agenteId);

            if (contacto is null) return Results.BadRequest("El contacto especificado no existe o no te pertenece.");

            var interaccion = new Interaction
            {
                Id = Guid.NewGuid(),
                ContactoId = command.ContactoId,
                TipoInteraccion = command.TipoInteraccion,
                Notas = command.Notas,
                FechaInteraccion = DateTimeOffset.UtcNow,
                AgenteId = agenteId
            };

            context.Interactions.Add(interaccion);
            await context.SaveChangesAsync();

            // Invalidar caches proactivamente
            await cacheStore.EvictByTagAsync("dashboard-data", ct);
            await cacheStore.EvictByTagAsync("analytics-data", ct);

            var response = new Response(
                interaccion.Id,
                interaccion.ContactoId,
                interaccion.TipoInteraccion,
                interaccion.Notas,
                interaccion.FechaInteraccion);

            return Results.Created($"/interacciones/{interaccion.Id}", response);
        })
        .WithTags("Interacciones")
        .WithName("RegistrarInteraccion");
    }
}
