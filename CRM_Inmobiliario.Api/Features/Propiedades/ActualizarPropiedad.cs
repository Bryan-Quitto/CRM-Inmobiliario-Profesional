using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Infrastructure.BackgroundServices;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class ActualizarPropiedadFeature
{
    public record Command(
        string Titulo,
        string Descripcion,
        string TipoPropiedad,
        string Operacion,
        decimal Precio,
        string Direccion,
        string Sector,
        string Ciudad,
        int Habitaciones,
        decimal Banos,
        decimal AreaTotal,
        bool EsCaptacionPropia,
        decimal PorcentajeComision);

    public static void MapActualizarPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPut("/propiedades/{id:guid}", async (Guid id, Command command, ClaimsPrincipal user, CrmDbContext context, IPdfGeneratorQueue pdfQueue) =>
        {
            var agenteId = user.GetRequiredUserId();

            var propiedad = await context.Properties
                .FirstOrDefaultAsync(p => p.Id == id && p.AgenteId == agenteId);

            if (propiedad is null)
            {
                return Results.NotFound();
            }

            propiedad.Titulo = command.Titulo;
            propiedad.Descripcion = command.Descripcion;
            propiedad.TipoPropiedad = command.TipoPropiedad;
            propiedad.Operacion = command.Operacion;
            propiedad.Precio = command.Precio;
            propiedad.Direccion = command.Direccion;
            propiedad.Sector = command.Sector;
            propiedad.Ciudad = command.Ciudad;
            propiedad.Habitaciones = command.Habitaciones;
            propiedad.Banos = command.Banos;
            propiedad.AreaTotal = command.AreaTotal;
            propiedad.EsCaptacionPropia = command.EsCaptacionPropia;
            propiedad.PorcentajeComision = command.PorcentajeComision;

            await context.SaveChangesAsync();

            // Encolar regeneración de PDF en segundo plano
            await pdfQueue.QueuePdfGenerationAsync(propiedad.Id);

            return Results.NoContent();
        })
        .WithTags("Propiedades")
        .WithName("ActualizarPropiedad");
    }
}
