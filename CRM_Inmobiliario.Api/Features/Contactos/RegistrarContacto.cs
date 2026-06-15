using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Features.Dashboard;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Contactos;

public static class RegistrarContactoFeature
{
    public record Command(string Nombre, string Apellido, string? Email, string? Telefono, string Origen, bool EsContacto, bool EsPropietario);

    public static void MapRegistrarContactoEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/contactos", async (Command command, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, IKpiWarmingService warmingService, CancellationToken ct) =>
        {
            var isWhatsAppOrigin = command.Origen.Contains("WhatsApp", StringComparison.OrdinalIgnoreCase);
            if (isWhatsAppOrigin && string.IsNullOrWhiteSpace(command.Telefono))
            {
                return Results.BadRequest(new { error = "El teléfono es obligatorio para contactos provenientes de WhatsApp." });
            }

            var agenteId = user.GetRequiredUserId();

            var telefonoNormalizado = string.IsNullOrWhiteSpace(command.Telefono) ? null : (command.Telefono.NormalizePhoneE164() ?? command.Telefono);

            if (!string.IsNullOrWhiteSpace(telefonoNormalizado))
            {
                var contactoExistente = await context.Contactos
                    .FirstOrDefaultAsync(c => c.AgenteId == agenteId && c.Telefono == telefonoNormalizado, ct);

                if (contactoExistente != null)
                {
                    var nombreCompleto = $"{contactoExistente.Nombre} {contactoExistente.Apellido}".Trim();
                    return Results.BadRequest(new { error = $"El contacto {nombreCompleto} ya tiene asignado este número de teléfono." });
                }
            }

            var contacto = new Contacto
            {
                AgenteId = agenteId,
                Nombre = command.Nombre,
                Apellido = command.Apellido,
                Email = command.Email,
                Telefono = telefonoNormalizado,
                Origen = command.Origen,
                EsProspecto = command.EsContacto,
                EsPropietario = command.EsPropietario,
                EtapaEmbudo = "Nuevo",
                EstadoPropietario = "Activo",
                FechaCreacion = DateTimeOffset.UtcNow
            };

            context.Contactos.Add(contacto);
            await context.SaveChangesAsync(ct);

            // Invalidar caché de contactos y KPIs
            await cacheStore.EvictByTagAsync("contactos", ct);
            await cacheStore.EvictByTagAsync("kpis", ct);

            // Pre-calentar caché de analítica
            warmingService.NotifyChange(agenteId);

            return Results.Created($"/contactos/{contacto.Id}", contacto);
        })
        .RequireAuthorization()
        .WithTags("Contactos")
        .WithName("RegistrarContacto");
    }
}
