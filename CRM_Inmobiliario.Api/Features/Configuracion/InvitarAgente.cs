using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using System.ComponentModel.DataAnnotations;
using System;
using System.Threading;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public static class InvitarAgente
{
    public sealed record Request(
        [Required][EmailAddress] string Email
    );

    public static IEndpointRouteBuilder MapInvitarAgenteEndpoint(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/configuracion/invitar-agente", async (
            Request request,
            Supabase.Client supabase,
            CancellationToken ct) =>
        {
            Console.WriteLine($"[InvitarAgente]: Procesando invitación solo con correo para {request.Email}");

            try
            {
                var serviceRoleKey = Environment.GetEnvironmentVariable("SUPABASE_ROLE_KEY");

                if (string.IsNullOrEmpty(serviceRoleKey))
                {
                    Console.WriteLine("[InvitarAgente] ERROR: La llave SUPABASE_ROLE_KEY no se encontró.");
                    return Results.Problem("Error de configuración del servidor.");
                }

                var adminAuth = supabase.AdminAuth(serviceRoleKey);
                
                Console.WriteLine($"[InvitarAgente]: Enviando invitación a {request.Email}...");
                
                bool invitacionEnviada = await adminAuth.InviteUserByEmail(request.Email);
                
                if (!invitacionEnviada)
                {
                    return Results.Problem("No se pudo generar la invitación en Supabase Auth.");
                }

                return Results.Ok(new { 
                    message = "Invitación enviada exitosamente. El usuario completará su perfil al activar la cuenta."
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
        .WithDescription("Invita a un nuevo agente al sistema enviando un correo de confirmación.");

        return endpoints;
    }
}
