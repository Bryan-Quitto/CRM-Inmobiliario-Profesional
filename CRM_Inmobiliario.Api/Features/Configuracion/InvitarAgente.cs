using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using System.ComponentModel.DataAnnotations;
using System;
using System.Threading;
using System.Collections.Generic;
using Supabase.Gotrue;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public static class InvitarAgente
{
    public sealed record Request(
        [Required][EmailAddress] string Email,
        Guid? AgenciaId = null
    );

    public static IEndpointRouteBuilder MapInvitarAgenteEndpoint(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/configuracion/invitar-agente", async (
            Request request,
            Supabase.Client supabase,
            CancellationToken ct) =>
        {
            Console.WriteLine($"[InvitarAgente]: Procesando invitación para {request.Email} (AgenciaId: {request.AgenciaId})");

            try
            {
                var serviceRoleKey = Environment.GetEnvironmentVariable("SUPABASE_ROLE_KEY");

                if (string.IsNullOrEmpty(serviceRoleKey))
                {
                    Console.WriteLine("[InvitarAgente] ERROR: La llave SUPABASE_ROLE_KEY no se encontró.");
                    return Results.Problem("Error de configuración del servidor.");
                }

                var adminAuth = supabase.AdminAuth(serviceRoleKey);
                
                // Preparamos los metadatos para que el frontend pueda recuperarlos al activar la cuenta
                var options = new InviteUserByEmailOptions
                {
                    Data = new Dictionary<string, object>
                    {
                        { "agencia_id", request.AgenciaId?.ToString() ?? "" }
                    }
                };
                
                Console.WriteLine($"[InvitarAgente]: Enviando invitación a {request.Email} con metadata...");
                
                bool invitacionEnviada = await adminAuth.InviteUserByEmail(request.Email, options);
                
                if (!invitacionEnviada)
                {
                    return Results.Problem("No se pudo generar la invitación en Supabase Auth.");
                }

                // IMPORTANTE: NO pre-registramos en la tabla 'Agents' aquí.
                // El registro se creará cuando el usuario acepte la invitación y complete su perfil.

                return Results.Ok(new { 
                    message = "Invitación enviada exitosamente."
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[InvitarAgente] ERROR CRÍTICO: {ex.Message}");
                return Results.Problem($"Error al procesar la invitación: {ex.Message}");
            }
        })
        .WithTags("Configuracion")
        .WithName("InvitarAgente")
        .WithDescription("Invita a un nuevo agente al sistema vinculándolo opcionalmente a una agencia a través de metadatos.");

        return endpoints;
    }
}
