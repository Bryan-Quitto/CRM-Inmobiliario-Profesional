using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Facebook;

public static class ObtenerConversacionFacebookIa
{
    public record MensajeChat(
        string Rol,
        string Contenido,
        DateTimeOffset Fecha);

    public static void MapObtenerConversacionFacebookIa(this IEndpointRouteBuilder app)
    {
        app.MapGet("/ia/facebook-conversacion/{psid}", async (string psid, int skip, int take, CrmDbContext context) =>
        {
            take = take == 0 ? 10 : take;

            var query = context.FacebookMessages
                .AsNoTracking()
                .Where(m => m.FacebookSenderId == psid);

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
        .WithName("ObtenerConversacionFacebookIa")
        .WithTags("IA");
    }
}
