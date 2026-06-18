using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Faqs;

public static class CrearFaqFeature
{
    public record Command(string Pregunta, string Respuesta);

    public static void MapCrearFaqEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/propiedades/{propiedadId:guid}/faqs", async (
            Guid propiedadId,
            Command command,
            ClaimsPrincipal user,
            CrmDbContext context) =>
        {
            if (string.IsNullOrWhiteSpace(command.Pregunta) || string.IsNullOrWhiteSpace(command.Respuesta))
                return Results.BadRequest("Pregunta y Respuesta son requeridas.");

            var agenteId = user.GetRequiredUserId();
            var userRole = user.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

            var propiedad = await context.Properties
                .Include(p => p.Agente)
                .Include(p => p.Transactions)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == propiedadId);

            if (propiedad is null) return Results.NotFound("Propiedad no encontrada.");

            var puedeGestionar = Propiedades.PropertyPermissionsHelper.CanManageFaq(propiedad, agenteId, userRole);
            var ahora = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5));

            var faq = new PropertyFaq
            {
                Id = Guid.NewGuid(),
                PropiedadId = propiedadId,
                Pregunta = command.Pregunta,
                Respuesta = command.Respuesta,
                Estado = puedeGestionar ? "Aprobada" : "Borrador",
                CreadoPorAgenteId = agenteId,
                FechaCreacion = ahora,
                FechaActualizacion = ahora
            };

            context.PropertyFaqs.Add(faq);
            await context.SaveChangesAsync();

            return Results.Created($"/api/faqs/{faq.Id}", new
            {
                faq.Id,
                faq.PropiedadId,
                faq.Pregunta,
                faq.Respuesta,
                faq.Estado,
                faq.CreadoPorAgenteId,
                faq.FechaCreacion,
                faq.FechaActualizacion
            });
        })
        .WithTags("FAQs")
        .WithName("CrearFaq");
    }
}
