using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class ListarPropiedadesFeature
{
    public record Response(
        Guid Id,
        string Titulo,
        string TipoPropiedad,
        string Operacion,
        decimal Precio,
        string Sector,
        string Ciudad,
        string EstadoComercial,
        bool EsCaptacionPropia,
        decimal PorcentajeComision,
        string AgenteNombre,
        string? ImagenPortadaUrl,
        PropertyPermissions Permissions,
        ActiveTransactionInfo? ActiveTransaction);

    public record PropertyPermissions(
        bool CanEditMasterData,
        bool CanChangeStatus);

    public record ActiveTransactionInfo(
        Guid AgenteId,
        string AgenteNombre);

    public static RouteHandlerBuilder MapListarPropiedadesEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/propiedades", async (ClaimsPrincipal user, CrmDbContext context) =>
        {
            var currentUserId = user.GetRequiredUserId();

            // Obtenemos la agencia del agente actual primero
            var agenciaId = await context.Agents
                .AsNoTracking()
                .Where(a => a.Id == currentUserId)
                .Select(a => a.AgenciaId)
                .FirstOrDefaultAsync();

            var query = context.Properties.AsNoTracking();

            if (agenciaId.HasValue)
            {
                // En agencia ves todo lo de la agencia O lo que tú mismo hayas registrado (por si acaso)
                query = query.Where(p => p.AgenciaId == agenciaId || p.CreatedByAgenteId == currentUserId);
            }
            else
            {
                // Independiente: Ves lo que captaste O lo que registraste tú mismo
                query = query.Where(p => p.AgenteId == currentUserId || p.CreatedByAgenteId == currentUserId);
            }

            var propiedades = await query
                .OrderByDescending(p => p.FechaIngreso)
                .Select(p => new
                {
                    Property = p,
                    ActiveTransaction = p.Transactions
                        .Where(t => t.TransactionStatus == "Active")
                        .OrderByDescending(t => t.TransactionDate)
                        .Select(t => new ActiveTransactionInfo(
                            t.CreatedById,
                            t.CreatedBy != null ? t.CreatedBy.Nombre + " " + t.CreatedBy.Apellido : "Agente desconocido"))
                        .FirstOrDefault()
                })
                .Select(x => new Response(
                    x.Property.Id,
                    x.Property.Titulo,
                    x.Property.TipoPropiedad,
                    x.Property.Operacion,
                    x.Property.Precio,
                    x.Property.Sector,
                    x.Property.Ciudad,
                    x.Property.EstadoComercial,
                    x.Property.EsCaptacionPropia,
                    x.Property.PorcentajeComision,
                    x.Property.Agente != null ? x.Property.Agente.Nombre + " " + x.Property.Agente.Apellido : "Agente Anónimo",
                    x.Property.Media
                        .Where(m => m.EsPrincipal)
                        .Select(m => m.UrlPublica)
                        .FirstOrDefault(),
                    new PropertyPermissions(
                        // Permiso de edición si eres el captador O el creador
                        x.Property.AgenteId == currentUserId || x.Property.CreatedByAgenteId == currentUserId,
                        x.Property.AgenteId == currentUserId || x.Property.CreatedByAgenteId == currentUserId || (x.ActiveTransaction != null && x.ActiveTransaction.AgenteId == currentUserId) || x.Property.EstadoComercial == "Disponible"
                    ),
                    x.ActiveTransaction))
                .ToListAsync();

            return Results.Ok(propiedades);
        })
        .WithTags("Propiedades")
        .WithName("ListarPropiedades");
    }
}
