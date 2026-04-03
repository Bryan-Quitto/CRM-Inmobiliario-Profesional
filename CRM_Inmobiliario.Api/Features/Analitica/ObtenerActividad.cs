using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Analitica;

public record ActividadResponse(
    int VisitasCompletadas,
    int CierresRealizados,
    int OfertasGeneradas,
    int CaptacionesPropias
);

public static class ObtenerActividadEndpoint
{
    public static void MapObtenerActividadEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/analitica/actividad", async (
            DateTimeOffset inicio, 
            DateTimeOffset fin, 
            ClaimsPrincipal user, 
            CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            // A. Visitas Completadas: TaskItem (Visita/Cita, Completada)
            var visitas = await context.Tasks
                .CountAsync(t => t.AgenteId == agenteId && 
                                 (t.TipoTarea == "Visita" || t.TipoTarea == "Cita") && 
                                 t.Estado == "Completado" && 
                                 t.FechaInicio >= inicio && t.FechaInicio <= fin);

            // B. Cierres Realizados: Leads en etapa "Cerrado" o "Ganado"
            var cierres = await context.Leads
                .CountAsync(l => l.AgenteId == agenteId && 
                                 (l.EtapaEmbudo == "Cerrado" || l.EtapaEmbudo == "Ganado") && 
                                 ((l.FechaCierre != null && l.FechaCierre >= inicio && l.FechaCierre <= fin) ||
                                  (l.FechaCierre == null && l.FechaCreacion >= inicio && l.FechaCreacion <= fin)));

            // C. Ofertas Generadas: Leads en etapa "En Negociación"
            var ofertas = await context.Leads
                .CountAsync(l => l.AgenteId == agenteId && 
                                 l.EtapaEmbudo == "En Negociación" && 
                                 l.FechaCreacion >= inicio && l.FechaCreacion <= fin);

            // E. Captaciones Propias: Propiedades del Agente marcadas como propias en el rango
            var captaciones = await context.Properties
                .CountAsync(p => p.AgenteId == agenteId && 
                                 p.EsCaptacionPropia && 
                                 p.FechaIngreso >= inicio && p.FechaIngreso <= fin);

            return Results.Ok(new ActividadResponse(visitas, cierres, ofertas, captaciones));
        })
        .WithTags("Analitica")
        .WithName("ObtenerActividad");
    }
}
