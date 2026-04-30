using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.OutputCaching;

namespace CRM_Inmobiliario.Api.Features.Clientes;

public static class ActualizarClienteFeature
{
    public record Command(
        string Nombre,
        string? Apellido,
        string? Email,
        string Telefono,
        string Origen,
        bool EsPropietario);

    public static void MapActualizarClienteEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPut("/clientes/{id:guid}", async (Guid id, Command command, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();

            var cliente = await context.Leads
                .FirstOrDefaultAsync(l => l.Id == id && l.AgenteId == agenteId);

            if (cliente is null)
            {
                return Results.NotFound();
            }

            cliente.Nombre = command.Nombre;
            cliente.Apellido = command.Apellido;
            cliente.Email = command.Email;
            cliente.Telefono = command.Telefono.NormalizeEcuadorPhone() ?? command.Telefono;
            cliente.Origen = command.Origen;
            cliente.EsPropietario = command.EsPropietario;

            await context.SaveChangesAsync();

            // Invalidar caches proactivamente
            await cacheStore.EvictByTagAsync("dashboard-data", ct);
            await cacheStore.EvictByTagAsync("analytics-data", ct);

            return Results.NoContent();
        })
        .WithTags("Clientes")
        .WithName("ActualizarCliente");
    }
}
