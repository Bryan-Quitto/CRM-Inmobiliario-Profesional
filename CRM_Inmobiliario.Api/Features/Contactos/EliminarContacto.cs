using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Contactos;

public static class EliminarContacto
{
    public static void MapEliminarContactoEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapDelete("/contactos/{id:guid}", (Guid id) =>
        {
            return Results.BadRequest(new { Message = "La eliminación de contactos está deshabilitada en el sistema para preservar la integridad transaccional (SSoT)." });
        })
        .RequireAuthorization()
        .WithName("EliminarContacto")
        .WithTags("Contactos");
    }
}
