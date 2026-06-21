using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Features.PushNotifications.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Faqs;

public static class RechazarFaqFeature
{
    public record Command(string NotaRechazo);

    public static void MapRechazarFaqEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/faqs/{faqId:guid}/rechazar", async (
            Guid faqId,
            Command command,
            ClaimsPrincipal user,
            CrmDbContext context,
            IPushNotificationService pushService,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(command.NotaRechazo))
                return Results.BadRequest("La nota de rechazo es requerida.");

            var agenteId = user.GetRequiredUserId();
            var userRole = user.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

            var faq = await context.PropertyFaqs
                .Include(f => f.Propiedad)
                    .ThenInclude(p => p.Agente)
                .Include(f => f.Propiedad)
                    .ThenInclude(p => p.Transactions)
                .FirstOrDefaultAsync(f => f.Id == faqId);

            if (faq is null) return Results.NotFound("FAQ no encontrada.");

            if (!Propiedades.PropertyPermissionsHelper.CanManageFaq(faq.Propiedad, agenteId, userRole))
                return Results.Forbid();

            if (faq.Estado != "EnRevision")
                return Results.Conflict($"Solo se puede rechazar un FAQ en estado EnRevision. Estado actual: '{faq.Estado}'.");

            faq.Estado = "Rechazada";
            faq.NotaRechazo = command.NotaRechazo;
            faq.FechaActualizacion = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5));

            await context.SaveChangesAsync();
            await context.UpsertAgentPropertyActivityAsync(user.GetRequiredUserId(), faq.PropiedadId, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), default);

            await pushService.SendNotificationToAgentAsync(
                faq.CreadoPorAgenteId,
                "Tu pregunta frecuente fue rechazada",
                command.NotaRechazo,
                ct: ct);

            return Results.Ok(new { faq.Id, faq.Estado, faq.NotaRechazo, faq.FechaActualizacion });
        })
        .WithTags("FAQs")
        .WithName("RechazarFaq");
    }
}

