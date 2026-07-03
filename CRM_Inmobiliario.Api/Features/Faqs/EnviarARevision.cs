using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Faqs;

public static class EnviarARevisionFeature
{
    public static void MapEnviarARevisionEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/faqs/{faqId:guid}/enviar-revision", async (
            Guid faqId,
            ClaimsPrincipal user,
            CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            var faq = await context.PropertyFaqs
                .FirstOrDefaultAsync(f => f.Id == faqId);

            if (faq is null) return Results.NotFound("FAQ no encontrada.");

            if (faq.CreadoPorAgenteId != agenteId)
                return Results.Forbid();

            if (faq.Estado != "Borrador")
                return Results.Conflict($"Solo se puede enviar a revisión un FAQ en estado Borrador. Estado actual: '{faq.Estado}'.");

            faq.Estado = "EnRevision";
            faq.FechaActualizacion = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5));

            await context.SaveChangesAsync();
            await context.UpsertAgentPropertyActivityAsync(agenteId, faq.PropiedadId, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), CancellationToken.None);

            return Results.Ok(new { faq.Id, faq.Estado, faq.FechaActualizacion });
        })
        .WithTags("FAQs")
        .WithName("EnviarFaqARevision");
    }
}
