using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Interacciones;

public static class RegistrarInteraccionFeature
{
    public record Command(
        Guid ClienteId,
        string TipoInteraccion,
        string Notas);

    public record Response(
        Guid Id,
        Guid ClienteId,
        string TipoInteraccion,
        string Notas,
        DateTimeOffset FechaInteraccion);

    public static void MapRegistrarInteraccionEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/interacciones", async (Command command, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            var cliente = await context.Leads
                .FirstOrDefaultAsync(l => l.Id == command.ClienteId && l.AgenteId == agenteId);

            if (cliente is null) return Results.BadRequest("El cliente especificado no existe o no te pertenece.");

            var interaccion = new Interaction
            {
                Id = Guid.NewGuid(),
                ClienteId = command.ClienteId,
                TipoInteraccion = command.TipoInteraccion,
                Notas = command.Notas,
                FechaInteraccion = DateTimeOffset.UtcNow,
                AgenteId = agenteId
            };

            context.Interactions.Add(interaccion);
            await context.SaveChangesAsync();

            var response = new Response(
                interaccion.Id,
                interaccion.ClienteId,
                interaccion.TipoInteraccion,
                interaccion.Notas,
                interaccion.FechaInteraccion);

            return Results.Created($"/interacciones/{interaccion.Id}", response);
        })
        .WithTags("Interacciones")
        .WithName("RegistrarInteraccion");
    }
}
