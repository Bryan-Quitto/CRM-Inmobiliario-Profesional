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
        string? Telefono,
        string Origen,
        bool EsContacto,
        bool EsPropietario);

    public static void MapActualizarContactoEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPut("/contactos/{id:guid}", async (Guid id, Command command, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, CancellationToken ct) =>
        {
            var isWhatsAppOrigin = command.Origen.Contains("WhatsApp", StringComparison.OrdinalIgnoreCase);
            if (isWhatsAppOrigin && string.IsNullOrWhiteSpace(command.Telefono))
            {
                return Results.BadRequest(new { error = "El teléfono es obligatorio para contactos provenientes de WhatsApp." });
            }

            var agenteId = user.GetRequiredUserId();
            var contacto = await context.Contactos
                .FirstOrDefaultAsync(l => l.Id == id && l.AgenteId == agenteId, ct);

            if (contacto is null)
            {
                return Results.NotFound();
            }

            var telefonoNormalizado = string.IsNullOrWhiteSpace(command.Telefono) ? null : (command.Telefono.NormalizePhoneE164() ?? command.Telefono);

            if (!string.IsNullOrWhiteSpace(telefonoNormalizado))
            {
                var contactoExistente = await context.Contactos
                    .FirstOrDefaultAsync(c => c.AgenteId == agenteId && c.Id != id && c.Telefono == telefonoNormalizado, ct);

                if (contactoExistente != null)
                {
                    var nombreCompleto = $"{contactoExistente.Nombre} {contactoExistente.Apellido}".Trim();
                    return Results.BadRequest(new { error = $"El contacto {nombreCompleto} ya tiene asignado este número de teléfono." });
                }
            }

            contacto.Nombre = command.Nombre;
            contacto.Apellido = command.Apellido;
            contacto.Email = command.Email;
            contacto.Telefono = telefonoNormalizado;
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
