using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Clientes;

public static class ListarClientesFeature
{
    // DTO de respuesta para optimizar la carga
    public record ClienteResponse(
        Guid Id, 
        string Nombre, 
        string? Apellido, 
        string? Email, 
        string Telefono, 
        string EtapaEmbudo,
        DateTimeOffset FechaCreacion
    );

    public static void MapListarClientesEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/clientes", async (CrmDbContext context) =>
        {
            var clientes = await context.Leads
                .AsNoTracking()
                .OrderByDescending(l => l.FechaCreacion)
                .Select(l => new ClienteResponse(
                    l.Id,
                    l.Nombre,
                    l.Apellido,
                    l.Email,
                    l.Telefono,
                    l.EtapaEmbudo,
                    l.FechaCreacion
                ))
                .ToListAsync();

            return Results.Ok(clientes);
        })
        .WithTags("Clientes")
        .WithName("ListarClientes");
    }
}
