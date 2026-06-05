using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using System.ComponentModel.DataAnnotations;
using System;
using System.Threading;
using System.Collections.Generic;
using Supabase.Gotrue;
using Microsoft.EntityFrameworkCore;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public static class ActivarAgenteInvitado
{
    public sealed record Request(
        Guid Id,
        [Required][EmailAddress] string RealEmail,
        Guid? AgenciaId
    );

    public static IEndpointRouteBuilder MapActivarAgenteInvitadoEndpoint(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/configuracion/activar-agente-invitado", async (
            Request request,
            CrmDbContext context,
            Supabase.Client supabase,
            CancellationToken ct) =>
        {
            var agent = await context.Agents.FirstOrDefaultAsync(a => a.Id == request.Id, ct);
            if (agent == null)
            {
                return Results.NotFound(new { message = "Agente invitado no encontrado." });
            }
            if (agent.Activo)
            {
                return Results.BadRequest(new { message = "El agente ya está activo." });
            }

            var oldEmail = agent.Email;
            var oldAgenciaId = agent.AgenciaId;

            // [Decision]: Update local DB with Real Email FIRST. If the network call fails, we manually rollback.
            // This prevents long-running transactions over HTTP and ensures retry-ability if the network fails.
            agent.Email = request.RealEmail;
            agent.AgenciaId = request.AgenciaId;
            
            await context.SaveChangesAsync(ct);

            // [Architecture]: Send invitation via Supabase Admin Auth
            var serviceRoleKey = Environment.GetEnvironmentVariable("SUPABASE_ROLE_KEY");
            if (string.IsNullOrEmpty(serviceRoleKey))
            {
                // Rollback manual
                agent.Email = oldEmail;
                agent.AgenciaId = oldAgenciaId;
                await context.SaveChangesAsync(ct);
                return Results.Problem("Error de configuración del servidor.");
            }

            var adminAuth = supabase.AdminAuth(serviceRoleKey);
            
            // [Pattern]: Pass the guest_agent_id in the User Metadata.
            var options = new InviteUserByEmailOptions
            {
                Data = new Dictionary<string, object>
                {
                    { "agencia_id", request.AgenciaId?.ToString() ?? "" },
                    { "guest_agent_id", request.Id.ToString() }
                }
            };

            bool invitacionEnviada = await adminAuth.InviteUserByEmail(request.RealEmail, options);
            if (!invitacionEnviada)
            {
                // Rollback manual
                agent.Email = oldEmail;
                agent.AgenciaId = oldAgenciaId;
                await context.SaveChangesAsync(ct);
                return Results.Problem("No se pudo generar la invitación en Supabase Auth.");
            }
            
            return Results.Ok(new { message = "Agente invitado actualizado e invitación enviada exitosamente." });
        })
        .RequireAuthorization("AdminPolicy")
        .WithTags("Configuracion")
        .WithName("ActivarAgenteInvitado")
        .WithDescription("Actualiza un agente invitado inactivo con su correo real y agencia, y envía una invitación.");

        return endpoints;
    }
}
