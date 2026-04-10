using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.OutputCaching;

namespace CRM_Inmobiliario.Api.Features.Clientes;

public static class RegistrarClienteFeature
{
    public record Command(string Nombre, string? Apellido, string? Email, string Telefono, string Origen);

    public static void MapRegistrarClienteEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/clientes", async (Command command, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();

            var lead = new Lead
            {
                Id = Guid.NewGuid(),
                Nombre = command.Nombre,
                Apellido = command.Apellido,
                Email = command.Email,
                Telefono = command.Telefono.NormalizeEcuadorPhone() ?? command.Telefono,
                Origen = command.Origen,
                EtapaEmbudo = "Nuevo", // Valor por defecto según requerimiento
                AgenteId = agenteId,
                FechaCreacion = DateTimeOffset.UtcNow
            };

            context.Leads.Add(lead);
            await context.SaveChangesAsync();

            // Invalidar caches proactivamente
            await cacheStore.EvictByTagAsync("dashboard-data", ct);
            await cacheStore.EvictByTagAsync("analytics-data", ct);

            return Results.Created($"/clientes/{lead.Id}", lead);
        })
        .WithTags("Clientes")
        .WithName("RegistrarCliente");
    }
}
