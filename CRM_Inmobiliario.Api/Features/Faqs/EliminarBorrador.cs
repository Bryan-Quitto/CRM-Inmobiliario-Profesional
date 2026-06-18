using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Faqs;

public static class EliminarBorradorFeature
{
    public static void MapEliminarBorradorEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapDelete("/faqs/{faqId:guid}", async (
            Guid faqId,
            ClaimsPrincipal user,
            CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            var faq = await context.PropertyFaqs
                .FirstOrDefaultAsync(f => f.Id == faqId);

            if (faq is null) return Results.NotFound("FAQ no encontrada.");

            if (faq.Estado != "Borrador")
                return Results.Conflict($"No se puede eliminar un FAQ en estado '{faq.Estado}'. Solo se pueden eliminar FAQs en estado Borrador.");

            if (faq.CreadoPorAgenteId != agenteId)
                return Results.Forbid();

            context.PropertyFaqs.Remove(faq);
            await context.SaveChangesAsync();

            return Results.NoContent();
        })
        .WithTags("FAQs")
        .WithName("EliminarBorradorFaq");
    }
}
