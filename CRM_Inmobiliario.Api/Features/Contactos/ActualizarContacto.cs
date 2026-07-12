using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.EntityFrameworkCore;
using CRM_Inmobiliario.Api.Infrastructure.Validation;

namespace CRM_Inmobiliario.Api.Features.Contactos;

public static class ActualizarContactoFeature
{
    public record Command(
        string Nombre,
        string Apellido,
        string? Email,
        string? Telefono,
        string Origen,
        bool EsCliente,
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

            if (await context.AgentArchivedContacts.AnyAsync(a => a.AgentId == agenteId && a.ContactoId == id, ct))
            {
                return Results.BadRequest(new { message = "No puedes modificar un registro archivado" });
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

            if (contacto.EsPropietario && !command.EsPropietario)
            {
                var tienePropiedades = await context.Properties.AnyAsync(p => p.PropietarioId == id, ct);
                if (tienePropiedades)
                {
                    return Results.BadRequest(new { error = "No puedes quitar el rol de Propietario porque tiene propiedades enlazadas." });
                }
            }

            if (contacto.EsCliente && !command.EsCliente)
            {
                var tienePropiedadesCerradas = await context.Properties.AnyAsync(p => p.CerradoConId == id && (p.EstadoComercial == "Reservada" || p.EstadoComercial == "Alquilada" || p.EstadoComercial == "Vendida"), ct);
                if (tienePropiedadesCerradas)
                {
                    return Results.BadRequest(new { error = "No puedes quitar el rol de Cliente porque tiene propiedades enlazadas (Reservadas, Alquiladas o Vendidas)." });
                }
            }

            contacto.Nombre = command.Nombre;
            contacto.Apellido = command.Apellido;
            contacto.Email = command.Email;
            contacto.Telefono = telefonoNormalizado;
            contacto.Origen = command.Origen;
            contacto.EsCliente = command.EsCliente;
            contacto.EsPropietario = command.EsPropietario;
            await context.SaveChangesAsync(ct);
            await context.UpsertAgentContactActivityAsync(agenteId, id, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), ct);
            await cacheStore.EvictByTagAsync("contactos", ct);

            return Results.NoContent();
        })
        .RequireAuthorization()
        .WithTags("Contactos")
        .WithName("ActualizarContacto")
        .WithValidation<Command>();
    }
}
