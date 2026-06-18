using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Faqs;

public static class EditarFaqFeature
{
    public record Command(string? Pregunta, string? Respuesta);

    public static void MapEditarFaqEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPut("/faqs/{faqId:guid}", async (
            Guid faqId,
            Command command,
            ClaimsPrincipal user,
            CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            var faq = await context.PropertyFaqs
                .FirstOrDefaultAsync(f => f.Id == faqId);

            if (faq is null) return Results.NotFound("FAQ no encontrada.");

            if (faq.CreadoPorAgenteId != agenteId)
                return Results.Forbid();

            if (faq.Estado != "Borrador" && faq.Estado != "Rechazada")
                return Results.Conflict($"No se puede editar un FAQ en estado '{faq.Estado}'. Solo Borrador o Rechazada.");

            if (!string.IsNullOrWhiteSpace(command.Pregunta)) faq.Pregunta = command.Pregunta;
            if (!string.IsNullOrWhiteSpace(command.Respuesta)) faq.Respuesta = command.Respuesta;
            faq.FechaActualizacion = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5));

            await context.SaveChangesAsync();

            return Results.Ok(new
            {
                faq.Id,
                faq.PropiedadId,
                faq.Pregunta,
                faq.Respuesta,
                faq.Estado,
                faq.NotaRechazo,
                faq.CreadoPorAgenteId,
                faq.FechaCreacion,
                faq.FechaActualizacion
            });
        })
        .WithTags("FAQs")
        .WithName("EditarFaq");
    }
}
