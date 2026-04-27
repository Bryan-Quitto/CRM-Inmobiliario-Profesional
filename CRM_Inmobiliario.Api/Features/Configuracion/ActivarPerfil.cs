using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public static class ActivarPerfil
{
    public record Request(
        string Nombre,
        string Apellido,
        string Telefono,
        Guid? AgenciaId);

    public static IEndpointRouteBuilder MapActivarPerfilEndpoint(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/configuracion/activar-perfil", async (Request request, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();
            var email = user.FindFirstValue(ClaimTypes.Email) 
                        ?? user.FindFirstValue("email") 
                        ?? user.FindFirstValue("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress") 
                        ?? "";

            // Buscamos si ya existe (por si acaso hubo un reintento)
            var agente = await context.Agents.FirstOrDefaultAsync(a => a.Id == agenteId);

            if (agente == null)
            {
                agente = new Agent
                {
                    Id = agenteId,
                    Nombre = request.Nombre,
                    Apellido = request.Apellido,
                    Email = email,
                    Telefono = request.Telefono.NormalizeEcuadorPhone(),
                    AgenciaId = request.AgenciaId,
                    Rol = "Agente",
                    Activo = true,
                    FechaCreacion = DateTimeOffset.UtcNow
                };
                context.Agents.Add(agente);
            }
            else
            {
                // Si ya existe, actualizamos los datos
                agente.Nombre = request.Nombre;
                agente.Apellido = request.Apellido;
                agente.Telefono = request.Telefono.NormalizeEcuadorPhone();
                agente.AgenciaId = request.AgenciaId;
                agente.Activo = true;
            }

            await context.SaveChangesAsync();

            return Results.Ok(new { message = "Perfil activado y registrado exitosamente." });
        })
        .WithTags("Configuracion")
        .WithName("ActivarPerfil")
        .WithDescription("Crea o actualiza el registro del agente en la base de datos tras la activación de la cuenta.");

        return endpoints;
    }
}
