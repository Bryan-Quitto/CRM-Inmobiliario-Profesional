using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.WhatsApp;

public static class ObtenerConversacionIa
{
    public record MensajeChat(
        string Rol,
        string Contenido,
        DateTimeOffset Fecha);

    public static void MapObtenerConversacionIa(this IEndpointRouteBuilder app)
    {
        app.MapGet("/ia/conversacion/{telefono}", async (string telefono, int skip, int take, CrmDbContext context) =>
        {
            take = take == 0 ? 10 : take;

            var query = context.WhatsappMessages
                .AsNoTracking()
                .Where(m => m.Telefono == telefono);

            var total = await query.CountAsync();

            var mensajes = await query
                .OrderByDescending(m => m.Fecha)
                .Skip(skip)
                .Take(take)
                .Select(m => new MensajeChat(
                    m.Rol == "user" ? "cliente" : "ia",
                    m.Contenido,
                    m.Fecha
                ))
                .ToListAsync();

            // Los devolvemos en orden ascendente (más antiguo primero) para el chat
            return Results.Ok(new { 
                Mensajes = mensajes.OrderBy(m => m.Fecha).ToList(), 
                Total = total 
            });
        })
        .WithName("ObtenerConversacionIa")
        .WithTags("IA");
    }
}
