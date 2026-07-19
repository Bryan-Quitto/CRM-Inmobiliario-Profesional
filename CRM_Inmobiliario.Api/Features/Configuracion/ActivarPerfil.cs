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
        Guid? AgenciaId,
        Guid? GuestAgentId = null,
        string? TerminosAceptadosVersion = null,
        string? PlanTier = "Normal",
        int? SubscriptionMonths = 1,
        string? SubscriptionNotes = null);

    public static IEndpointRouteBuilder MapActivarPerfilEndpoint(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/configuracion/activar-perfil", async (Request request, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();
            var email = user.FindFirstValue(ClaimTypes.Email) 
                        ?? user.FindFirstValue("email") 
                        ?? user.FindFirstValue("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress") 
                        ?? "";

            var strategy = context.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
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
                        Telefono = request.Telefono.NormalizePhoneE164() ?? request.Telefono,
                        AgenciaId = request.AgenciaId,
                        Rol = "Agente",
                        Activo = true,
                        FechaCreacion = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)),
                        TerminosAceptadosVersion = request.TerminosAceptadosVersion
                    };
                    context.Agents.Add(agente);
                }
                else
                {
                    // Si ya existe, actualizamos los datos
                    agente.Nombre = request.Nombre;
                    agente.Apellido = request.Apellido;
                    agente.Telefono = request.Telefono.NormalizePhoneE164() ?? request.Telefono;
                    agente.AgenciaId = request.AgenciaId;
                    agente.Activo = true;
                    if (!string.IsNullOrEmpty(request.TerminosAceptadosVersion))
                    {
                        agente.TerminosAceptadosVersion = request.TerminosAceptadosVersion;
                    }
                }

                await using var transaction = await context.Database.BeginTransactionAsync();

                if (request.GuestAgentId.HasValue)
                {
                    var oldId = request.GuestAgentId.Value;
                    
                    // SECURITY VALIDATION: Prevent IDOR / Account takeover
                    var guestAgent = await context.Agents.AsNoTracking().FirstOrDefaultAsync(a => a.Id == oldId && a.Email == email);
                    if (guestAgent == null)
                    {
                        await transaction.RollbackAsync();
                        return Results.BadRequest(new { message = "ID de agente invitado inválido o no corresponde a tu correo." });
                    }
                    
                    await context.Properties
                        .Where(p => p.AgenteId == oldId)
                        .ExecuteUpdateAsync(s => s.SetProperty(p => p.AgenteId, agenteId));

                    await context.Properties
                        .Where(p => p.CreatedByAgenteId == oldId)
                        .ExecuteUpdateAsync(s => s.SetProperty(p => p.CreatedByAgenteId, agenteId));

                    await context.Contactos
                        .Where(c => c.AgenteId == oldId)
                        .ExecuteUpdateAsync(s => s.SetProperty(c => c.AgenteId, agenteId));

                    // Opcional: Eliminar el agente invitado viejo o dejarlo inactivo/renombrado
                    await context.Agents
                        .Where(a => a.Id == oldId)
                        .ExecuteDeleteAsync();
                }

                // Crear suscripción si no existe
                var existingSub = await context.Subscriptions.FirstOrDefaultAsync(s => s.AgentId == agenteId);
                if (existingSub == null)
                {
                    var nowEcuador = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5));
                    var newSub = new Subscription
                    {
                        AgentId = agenteId,
                        PlanTier = request.PlanTier ?? "Normal",
                        Status = "Active",
                        CurrentPeriodStart = nowEcuador,
                        CurrentPeriodEnd = nowEcuador.AddMonths(request.SubscriptionMonths ?? 1),
                        PaymentNotes = request.SubscriptionNotes
                    };
                    context.Subscriptions.Add(newSub);
                }

                await context.SaveChangesAsync();

                await transaction.CommitAsync();

                return Results.Ok(new { message = "Perfil activado y registrado exitosamente." });
            });
        })
        .WithTags("Configuracion")
        .WithName("ActivarPerfil")
        .WithDescription("Crea o actualiza el registro del agente en la base de datos tras la activación de la cuenta.");

        return endpoints;
    }
}
