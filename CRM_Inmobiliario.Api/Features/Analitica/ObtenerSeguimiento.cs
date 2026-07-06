using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.Analitica;

public record ContactoSeguimientoItem(Guid Id, string Nombre, string Apellido, string EstadoEmbudo);
public record SeguimientoResponse(int SeguimientoRequerido, List<ContactoSeguimientoItem> Contactos);

public static class ObtenerSeguimientoEndpoint
{
    public static IEndpointConventionBuilder MapObtenerSeguimientoEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/analitica/seguimiento", async (
            ClaimsPrincipal user, 
            CrmDbContext context,
            ILoggerFactory loggerFactory) =>
        {
            var logger = loggerFactory.CreateLogger("Analitica.Seguimiento");
            var agenteId = user.GetRequiredUserId();

            // Etapas que ya no se consideran "Seguimiento Crítico" porque ya están en proceso avanzado o finalizado
            var estadosExcluidos = new[] { "En Negociación", "Cerrado", "Perdido" };

            // D. Seguimiento Crítico: 
            // 1. Interés Medio o Alto
            // 2. Que NO estén en Negociación, Cerrados o Perdidos
            var contactosConInteres = await context.Contactos
                .AsNoTracking()
                .Where(l => l.AgenteId == agenteId && !estadosExcluidos.Contains(l.EstadoEmbudo))
                .Where(l => l.PropertyInterests.Any(i => i.NivelInteres == "Medio" || i.NivelInteres == "Alto"))
                .Select(l => new ContactoSeguimientoItem(l.Id, l.Nombre, l.Apellido ?? "", l.EstadoEmbudo))
                .ToListAsync();


            return Results.Ok(new SeguimientoResponse(contactosConInteres.Count, contactosConInteres));
        })
        .WithTags("Analitica")
        .WithName("ObtenerSeguimiento")
        .CacheOutput(p => p.Tag("analytics-data").Expire(TimeSpan.FromMinutes(5)).SetVaryByHeader("Authorization"));
    }
}
