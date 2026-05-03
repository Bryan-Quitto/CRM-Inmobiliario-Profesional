using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Contactos;

public static class ActualizarContactoFeature
{
    public record Command(
        string Nombre,
        string Apellido,
        string? Email,
        string Telefono,
        string Origen,
        bool EsContacto,
        bool EsPropietario);

    public static void MapActualizarContactoEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPut("/contactos/{id:guid}", async (Guid id, Command command, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();
            var contacto = await context.Contactos
                .FirstOrDefaultAsync(l => l.Id == id && l.AgenteId == agenteId, ct);

            if (contacto is null)
            {
                return Results.NotFound();
            }

            contacto.Nombre = command.Nombre;
            contacto.Apellido = command.Apellido;
            contacto.Email = command.Email;
            contacto.Telefono = command.Telefono.NormalizeEcuadorPhone() ?? command.Telefono;
            contacto.Origen = command.Origen;
            contacto.EsProspecto = command.EsContacto;
            contacto.EsPropietario = command.EsPropietario;

            await context.SaveChangesAsync(ct);
            await cacheStore.EvictByTagAsync("contactos", ct);

            return Results.NoContent();
        })
        .RequireAuthorization()
        .WithTags("Contactos")
        .WithName("ActualizarContacto");
    }
}
