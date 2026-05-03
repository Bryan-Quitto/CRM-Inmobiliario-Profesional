using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Contactos;

public static class ObtenerContactoPorIdFeature
{
    public record ContactoDetalleResponse(
        Guid Id,
        string Nombre,
        string? Apellido,
        string? Email,
        string Telefono,
        string Origen,
        string EtapaEmbudo,
        string EstadoPropietario,
        bool EsContacto,
        bool EsPropietario,
        DateTimeOffset FechaCreacion,
        List<InteraccionResponse> Interacciones,
        List<InteresPropiedadResponse> Intereses,
        List<PropiedadCaptadaResponse> PropiedadesCaptadas);

    public record InteraccionResponse(
        Guid Id,
        string TipoInteraccion,
        string Notas,
        DateTimeOffset FechaInteraccion);

    public record InteresPropiedadResponse(
        Guid PropiedadId,
        string Titulo,
        decimal Precio,
        string EstadoComercial,
        string NivelInteres,
        DateTimeOffset FechaRegistro);

    public record PropiedadCaptadaResponse(
        Guid Id,
        string Titulo,
        string TipoPropiedad,
        decimal Precio,
        string EstadoComercial,
        DateTimeOffset FechaIngreso);

    public static RouteHandlerBuilder MapObtenerContactoPorIdEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/contactos/{id:guid}", async (Guid id, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            var contacto = await context.Contactos
                .AsNoTracking()
                .AsSplitQuery()
                .Where(c => c.Id == id && c.AgenteId == agenteId)
                .Select(c => new ContactoDetalleResponse(
                    c.Id,
                    c.Nombre,
                    c.Apellido,
                    c.Email,
                    c.Telefono,
                    c.Origen,
                    c.EtapaEmbudo,
                    c.EstadoPropietario,
                    c.EsProspecto,
                    c.EsPropietario,
                    c.FechaCreacion,
                    c.Interactions
                        .OrderByDescending(i => i.FechaInteraccion)
                        .Select(i => new InteraccionResponse(i.Id, i.TipoInteraccion, i.Notas, i.FechaInteraccion))
                        .ToList(),
                    c.PropertyInterests
                        .OrderByDescending(i => i.FechaRegistro)
                        .Select(i => new InteresPropiedadResponse(
                            i.PropiedadId,
                            i.Propiedad!.Titulo,
                            i.Propiedad.Precio,
                            i.Propiedad.EstadoComercial,
                            i.NivelInteres,
                            i.FechaRegistro))
                        .ToList(),
                    c.PropertiesOwned
                        .OrderByDescending(p => p.FechaIngreso)
                        .Select(p => new PropiedadCaptadaResponse(
                            p.Id,
                            p.Titulo,
                            p.TipoPropiedad,
                            p.Precio,
                            p.EstadoComercial,
                            p.FechaIngreso))
                        .ToList()
                ))
                .FirstOrDefaultAsync();

            return contacto is not null
                ? Results.Ok(contacto)
                : Results.NotFound();
        })
        .RequireAuthorization()
        .WithTags("Contactos")
        .WithName("ObtenerContactoPorId");
    }
}
