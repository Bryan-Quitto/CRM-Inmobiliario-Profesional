using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Features.Dashboard;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.OutputCaching;

namespace CRM_Inmobiliario.Api.Features.Contactos;

public static class RegistrarContactoFeature
{
    public record Command(string Nombre, string Apellido, string? Email, string Telefono, string Origen, bool EsProspecto, bool EsPropietario);

    public static void MapRegistrarContactoEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/contactos", async (Command command, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, IKpiWarmingService warmingService, CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();

            var contacto = new Contacto
            {
                AgenteId = agenteId,
                Nombre = command.Nombre,
                Apellido = command.Apellido,
                Email = command.Email,
                Telefono = command.Telefono.NormalizeEcuadorPhone() ?? command.Telefono,
                Origen = command.Origen,
                EsProspecto = command.EsProspecto,
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
