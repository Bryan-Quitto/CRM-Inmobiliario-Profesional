using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class EliminarImagenPropiedadFeature
{
    public static void MapEliminarImagenPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapDelete("/propiedades/{propiedadId}/imagenes/{imagenId}", async (
            [FromRoute] Guid propiedadId,
            [FromRoute] Guid imagenId,
            ClaimsPrincipal user,
            CrmDbContext context,
            Supabase.Client supabase) =>
        {
            var agenteId = user.GetRequiredUserId();

            var media = await context.PropertyMedia
                .Include(m => m.Propiedad).ThenInclude(p => p!.Agente)
                .Include(m => m.Propiedad).ThenInclude(p => p!.Transactions)
                .FirstOrDefaultAsync(m => m.Id == imagenId && m.PropiedadId == propiedadId);

            if (media == null)
                return Results.NotFound("Imagen no encontrada.");

            if (!PropertyPermissionsHelper.CanManage(media.Propiedad!, agenteId))
                return Results.Json(new { Message = "No tienes permisos para eliminar imágenes de esta propiedad." }, statusCode: StatusCodes.Status403Forbidden);

            try
            {
                // 1. Eliminar archivo físico de Supabase Storage
                if (!string.IsNullOrEmpty(media.StoragePath))
                {
                    var response = await supabase.Storage.From("propiedades").Remove(new List<string> { media.StoragePath });
                    var count = response?.Count ?? 0;
                    Console.WriteLine($"DEBUG [Storage]: Intento de borrado de {media.StoragePath}. Confirmados por Supabase: {count}");
                    
                    if (count == 0) {
                        Console.WriteLine("ADVERTENCIA [Storage]: Supabase no eliminó el archivo. Verifica permisos RLS o que la Key sea 'service_role'.");
                    }
                }

                // 2. Eliminar registro de la DB
                context.PropertyMedia.Remove(media);
                await context.SaveChangesAsync();
                await context.UpsertAgentPropertyActivityAsync(user.GetRequiredUserId(), media.PropiedadId, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), default);

                return Results.NoContent();
            }
            catch (Exception ex)
            {
                return Results.Problem(ex.Message);
            }
        })
        .WithTags("Propiedades")
        .WithName("EliminarImagenPropiedad");
    }
}

