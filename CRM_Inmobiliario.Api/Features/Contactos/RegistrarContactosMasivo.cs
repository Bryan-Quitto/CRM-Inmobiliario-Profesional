using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Features.Dashboard;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Contactos;

public static class RegistrarContactosMasivoFeature
{
    public record ContactoMasivoDto(string Nombre, string Apellido, string? Email, string? Telefono, string Origen, bool EsCliente, bool EsPropietario);
    public record Command(List<ContactoMasivoDto> Contactos);

    public static void MapRegistrarContactosMasivoEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/contactos/masivo", async (Command command, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, IKpiWarmingService warmingService, CancellationToken ct) =>
        {
            if (command.Contactos == null || !command.Contactos.Any())
            {
                return Results.BadRequest(new { error = "La lista de contactos no puede estar vacía." });
            }

            var agenteId = user.GetRequiredUserId();
            var nuevosContactos = new List<Contacto>();
            var telefonosAProcesar = new List<string>();

            // 1. Normalizar teléfonos
            foreach (var dto in command.Contactos)
            {
                var telefonoNormalizado = string.IsNullOrWhiteSpace(dto.Telefono) ? null : (dto.Telefono.NormalizePhoneE164() ?? dto.Telefono);
                if (telefonoNormalizado != null)
                {
                    telefonosAProcesar.Add(telefonoNormalizado);
                }
            }

            // 2. Buscar existentes en un solo viaje (One Trip Pattern)
            var telefonosExistentes = new HashSet<string>();
            if (telefonosAProcesar.Any())
            {
                var existentes = await context.Contactos
                    .Where(c => c.AgenteId == agenteId && c.Telefono != null && telefonosAProcesar.Contains(c.Telefono))
                    .Select(c => c.Telefono!)
                    .ToListAsync(ct);
                
                telefonosExistentes = new HashSet<string>(existentes);
            }

            // 3. Procesar e ignorar duplicados por teléfono
            var fechaActual = DateTimeOffset.UtcNow;
            
            // Para evitar duplicados en la misma petición
            var telefonosProcesadosEnLote = new HashSet<string>();

            foreach (var dto in command.Contactos)
            {
                var telefonoNormalizado = string.IsNullOrWhiteSpace(dto.Telefono) ? null : (dto.Telefono.NormalizePhoneE164() ?? dto.Telefono);
                
                // Si tiene teléfono y ya existe en BD o en el lote actual, lo ignoramos para evitar fallas
                if (telefonoNormalizado != null)
                {
                    if (telefonosExistentes.Contains(telefonoNormalizado) || !telefonosProcesadosEnLote.Add(telefonoNormalizado))
                    {
                        continue;
                    }
                }

                var contacto = new Contacto
                {
                    AgenteId = agenteId,
                    Nombre = dto.Nombre,
                    Apellido = string.IsNullOrWhiteSpace(dto.Apellido) ? "" : dto.Apellido, // Evitar null
                    Email = dto.Email,
                    Telefono = telefonoNormalizado,
                    Origen = string.IsNullOrWhiteSpace(dto.Origen) ? "App" : dto.Origen,
                    EsCliente = dto.EsCliente,
                    EsPropietario = dto.EsPropietario,
                    EstadoEmbudo = "Nuevo",
                    EstadoPropietario = "Activo",
                    FechaCreacion = fechaActual
                };

                nuevosContactos.Add(contacto);
            }

            if (nuevosContactos.Any())
            {
                context.Contactos.AddRange(nuevosContactos);
                await context.SaveChangesAsync(ct);

                // Invalidar caché de contactos y KPIs una sola vez
                await cacheStore.EvictByTagAsync("contactos", ct);
                await cacheStore.EvictByTagAsync("kpis", ct);

                // Pre-calentar caché de analítica
                warmingService.NotifyChange(agenteId);
            }

            return Results.Ok(new { message = $"{nuevosContactos.Count} contactos importados correctamente.", count = nuevosContactos.Count });
        })
        .RequireAuthorization()
        .WithTags("Contactos")
        .WithName("RegistrarContactosMasivo");
    }
}
