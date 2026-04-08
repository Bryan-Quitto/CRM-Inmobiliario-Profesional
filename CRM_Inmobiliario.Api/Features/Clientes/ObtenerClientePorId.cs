using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Clientes;

public static class ObtenerClientePorIdFeature
{
    public record Response(
        Guid Id,
        string Nombre,
        string? Apellido,
        string? Email,
        string Telefono,
        string Origen,
        string EtapaEmbudo,
        string? Notas,
        DateTimeOffset FechaCreacion,
        List<InteraccionResponse> Interacciones,
        List<InteresResponse> Intereses);

    public record InteraccionResponse(
        Guid Id,
        string TipoInteraccion,
        string Notas,
        DateTimeOffset FechaInteraccion);

    public record InteresResponse(
        Guid PropiedadId,
        string Titulo,
        decimal Precio,
        string EstadoComercial,
        string NivelInteres,
        DateTimeOffset FechaRegistro);

    public static RouteHandlerBuilder MapObtenerClientePorIdEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/clientes/{id:guid}", async (Guid id, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            var cliente = await context.Leads
                .AsNoTracking()
                .AsSplitQuery()
                .Where(c => c.Id == id && c.AgenteId == agenteId)
                .Select(c => new Response(
                    c.Id,
                    c.Nombre,
                    c.Apellido,
                    c.Email,
                    c.Telefono,
                    c.Origen,
                    c.EtapaEmbudo,
                    c.Notas,
                    c.FechaCreacion,
                    c.Interactions
                        .OrderByDescending(i => i.FechaInteraccion)
                        .Select(i => new InteraccionResponse(
                            i.Id,
                            i.TipoInteraccion,
                            i.Notas,
                            i.FechaInteraccion))
                        .ToList(),
                    c.PropertyInterests
                        .OrderByDescending(i => i.FechaRegistro)
                        .Select(i => new InteresResponse(
                            i.PropiedadId,
                            i.Propiedad!.Titulo,
                            i.Propiedad.Precio,
                            i.Propiedad.EstadoComercial,
                            i.NivelInteres,
                            i.FechaRegistro))
                        .ToList()))
                .FirstOrDefaultAsync();

            return cliente is not null 
                ? Results.Ok(cliente) 
                : Results.NotFound();
        })
        .WithTags("Clientes")
        .WithName("ObtenerClientePorId");
    }
}
