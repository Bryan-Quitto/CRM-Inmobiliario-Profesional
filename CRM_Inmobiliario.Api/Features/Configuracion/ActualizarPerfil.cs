using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public static class ActualizarPerfilFeature
{
    public record Request(
        string Nombre,
        string Apellido,
        string? Telefono,
        string? Agencia,
        string? FotoUrl,
        string? LogoUrl);

    public static RouteHandlerBuilder MapActualizarPerfilEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapPut("/perfil", async (Request request, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();
            var email = user.FindFirstValue(ClaimTypes.Email) ?? user.FindFirstValue("email") ?? "";

            // Intentamos actualizar primero (más rápido)
            var rowsAffected = await context.Agents
                .Where(a => a.Id == agenteId)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(a => a.Nombre, request.Nombre)
                    .SetProperty(a => a.Apellido, request.Apellido)
                    .SetProperty(a => a.Telefono, request.Telefono.NormalizeEcuadorPhone())
                    .SetProperty(a => a.Agencia, request.Agencia)
                    .SetProperty(a => a.FotoUrl, request.FotoUrl)
                    .SetProperty(a => a.LogoUrl, request.LogoUrl));

            // Si no se afectaron filas, es que el agente no existe en la tabla public.Agents
            if (rowsAffected == 0)
            {
                var nuevoAgente = new Agent
                {
                    Id = agenteId,
                    Nombre = request.Nombre,
                    Apellido = request.Apellido,
                    Email = email,
                    Telefono = request.Telefono.NormalizeEcuadorPhone(),
                    Agencia = request.Agencia,
                    FotoUrl = request.FotoUrl,
                    LogoUrl = request.LogoUrl,
                    Rol = "Agente",
                    Activo = true,
                    FechaCreacion = DateTimeOffset.UtcNow
                };

                context.Agents.Add(nuevoAgente);
                await context.SaveChangesAsync();
            }

            return Results.NoContent();
        })
        .WithTags("Configuracion")
        .WithName("ActualizarPerfil");
    }
}
