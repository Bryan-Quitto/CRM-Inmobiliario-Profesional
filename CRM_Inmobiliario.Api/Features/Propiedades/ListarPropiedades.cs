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
        Guid GestorId,
        string GestorNombre,
        Guid? PropietarioId,
        Guid? CerradoConId,
        string? CerradoConNombre,
        string? ImagenPortadaUrl,
        DateTimeOffset FechaIngreso,
        PropertyPermissions Permissions,
        ActiveTransactionInfo? ActiveTransaction,
        string Version,
        int Habitaciones,
        decimal AreaTotal,
        int? AniosAntiguedad);

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
                // En agencia ves todo lo de la agencia, lo que tú registraste o donde hayas participado
                query = query.Where(p => p.AgenciaId == agenciaId || 
                                       p.CreatedByAgenteId == currentUserId || 
                                       p.Transactions.Any(t => t.CreatedById == currentUserId));
            }
            else
            {
                // Independiente: Ves lo que captaste, lo que registraste o donde hayas participado
                query = query.Where(p => p.AgenteId == currentUserId || 
                                       p.CreatedByAgenteId == currentUserId || 
                                       p.Transactions.Any(t => t.CreatedById == currentUserId));
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
                    x.Property.Agente != null ? x.Property.Agente.Nombre + " " + x.Property.Agente.Apellido : string.Empty,
                    (x.Property.EsCaptadorActivo && x.Property.AgenteId != null) ? x.Property.AgenteId.Value : x.Property.CreatedByAgenteId ?? Guid.Empty,
                    (x.Property.EsCaptadorActivo && x.Property.Agente != null) ? x.Property.Agente.Nombre + " " + x.Property.Agente.Apellido : (x.Property.CreatedByAgente != null ? x.Property.CreatedByAgente.Nombre + " " + x.Property.CreatedByAgente.Apellido : "Agente desconocido"),
                    x.Property.PropietarioId,
                    x.Property.CerradoConId,
                    x.Property.CerradoCon != null ? x.Property.CerradoCon.Nombre + " " + x.Property.CerradoCon.Apellido : null,
                    x.Property.Media
                        .Where(m => m.EsPrincipal)
                        .Select(m => m.UrlPublica)
                        .FirstOrDefault(),
                    x.Property.FechaIngreso,
                    new PropertyPermissions(
                        // Permiso de edición si:
                        // 1. Eres el captador Y está marcado como activo
                        // 2. Eres el creador Y el captador está marcado como inactivo (o no hay captador)
                        (x.Property.AgenteId == currentUserId && x.Property.EsCaptadorActivo) || 
                        (x.Property.CreatedByAgenteId == currentUserId && (!x.Property.EsCaptadorActivo || x.Property.AgenteId == null)),
                        
                        // Cambio de estado permitido SI Y SOLO SI:
                        // Eres el dueño/gestor según la regla de Agente Activo.
                        (x.Property.AgenteId == currentUserId && x.Property.EsCaptadorActivo) || 
                        (x.Property.CreatedByAgenteId == currentUserId && (!x.Property.EsCaptadorActivo || x.Property.AgenteId == null))
                    ),
                    x.ActiveTransaction,
                    x.Property.Version.ToString(),
                    x.Property.Habitaciones,
                    x.Property.AreaTotal,
                    x.Property.AniosAntiguedad))
                .ToListAsync();

            return Results.Ok(propiedades);
        })
        .WithTags("Propiedades")
        .WithName("ListarPropiedades");
    }
}
