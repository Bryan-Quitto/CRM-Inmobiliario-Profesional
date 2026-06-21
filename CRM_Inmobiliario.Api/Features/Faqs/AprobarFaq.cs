using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Faqs;

public static class AprobarFaqFeature
{
    public static void MapAprobarFaqEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/faqs/{faqId:guid}/aprobar", async (
            Guid faqId,
            ClaimsPrincipal user,
            CrmDbContext context) =>
        {
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
                return Results.Conflict($"Solo se puede aprobar un FAQ en estado EnRevision. Estado actual: '{faq.Estado}'.");

            faq.Estado = "Aprobada";
            faq.NotaRechazo = null;
            faq.FechaActualizacion = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5));

            await context.SaveChangesAsync();
            await context.UpsertAgentPropertyActivityAsync(user.GetRequiredUserId(), faq.PropiedadId, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), default);

            return Results.Ok(new { faq.Id, faq.Estado, faq.FechaActualizacion });
        })
        .WithTags("FAQs")
        .WithName("AprobarFaq");
    }
}

