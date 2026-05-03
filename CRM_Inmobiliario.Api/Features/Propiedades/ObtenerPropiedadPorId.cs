using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class ObtenerPropiedadPorIdFeature
{
    public record Response(
        Guid Id,
        string Titulo,
        string Descripcion,
        string TipoPropiedad,
        string Operacion,
        decimal Precio,
        string Direccion,
        string Sector,
        string Ciudad,
        string? GoogleMapsUrl,
        string? UrlRemax,
        int Habitaciones,
        decimal Banos,
        decimal AreaTotal,
        decimal? AreaTerreno,
        decimal? AreaConstruccion,
        int? Estacionamientos,
        int? MediosBanos,
        int? AniosAntiguedad,
        string EstadoComercial,
        bool EsCaptacionPropia,
        decimal PorcentajeComision,
        DateTimeOffset FechaIngreso,
        string AgenteNombre,
        Guid? PropietarioId,
        string? PropietarioNombre,
        IEnumerable<SectionResponse> Secciones,
        IEnumerable<MediaResponse> MediaSinSeccion,
        PropertyPermissions Permissions,
        ActiveTransactionInfo? ActiveTransaction);

    public record PropertyPermissions(
        bool CanEditMasterData,
        bool CanManageGallery,
        bool CanChangeStatus);

    public record ActiveTransactionInfo(
        Guid AgenteId,
        string AgenteNombre);

    public record SectionResponse(
        Guid Id,
        string Nombre,
        string? Descripcion,
        int Orden,
        IEnumerable<MediaResponse> Media);

    public record MediaResponse(
        Guid Id,
        string TipoMultimedia,
        string UrlPublica,
        string? Descripcion,
        bool EsPrincipal,
        int Orden);

    public static RouteHandlerBuilder MapObtenerPropiedadPorIdEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/propiedades/{id:guid}", async (Guid id, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var currentUserId = user.GetRequiredUserId();

            // Obtenemos la agencia del usuario actual para validar visibilidad multi-tenant
            var currentUserAgenciaId = await context.Agents
                .AsNoTracking()
                .Where(a => a.Id == currentUserId)
                .Select(a => a.AgenciaId)
                .FirstOrDefaultAsync();

            var propiedad = await context.Properties
                .AsNoTracking()
                .AsSplitQuery()
                .Where(p => p.Id == id && 
                           (p.AgenteId == currentUserId || p.CreatedByAgenteId == currentUserId || (currentUserAgenciaId != null && p.AgenciaId == currentUserAgenciaId)))
                .Select(p => new
                {
                    Property = p,
                    // Buscamos la transacción activa más reciente si el estado no es Disponible ni Inactiva
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
                    x.Property.Descripcion,
                    x.Property.TipoPropiedad,
                    x.Property.Operacion,
                    x.Property.Precio,
                    x.Property.Direccion,
                    x.Property.Sector,
                    x.Property.Ciudad,
                    x.Property.GoogleMapsUrl,
                    x.Property.UrlRemax,
                    x.Property.Habitaciones,
                    x.Property.Banos,
                    x.Property.AreaTotal,
                    x.Property.AreaTerreno,
                    x.Property.AreaConstruccion,
                    x.Property.Estacionamientos,
                    x.Property.MediosBanos,
                    x.Property.AniosAntiguedad,
                    x.Property.EstadoComercial,
                    x.Property.EsCaptacionPropia,
                    x.Property.PorcentajeComision,
                    x.Property.FechaIngreso,
                    x.Property.Agente != null ? x.Property.Agente.Nombre + " " + x.Property.Agente.Apellido : "Agente Anónimo",
                    x.Property.PropietarioId,
                    x.Property.Propietario != null ? x.Property.Propietario.Nombre + " " + x.Property.Propietario.Apellido : null,
                    x.Property.GallerySections
                        .OrderBy(s => s.Orden)
                        .Select(s => new SectionResponse(
                            s.Id,
                            s.Nombre,
                            s.Descripcion,
                            s.Orden,
                            s.Media
                                .OrderBy(m => m.Orden)
                                .Select(m => new MediaResponse(
                                    m.Id,
                                    m.TipoMultimedia,
                                    m.UrlPublica,
                                    m.Descripcion,
                                    m.EsPrincipal,
                                    m.Orden)))),
                    x.Property.Media
                        .Where(m => m.SectionId == null)
                        .OrderBy(m => m.Orden)
                        .Select(m => new MediaResponse(
                            m.Id,
                            m.TipoMultimedia,
                            m.UrlPublica,
                            m.Descripcion,
                            m.EsPrincipal,
                            m.Orden)),
                    new PropertyPermissions(
                        // Permiso de edición si eres el captador O el creador
                        x.Property.AgenteId == currentUserId || x.Property.CreatedByAgenteId == currentUserId,
                        x.Property.AgenteId == currentUserId || x.Property.CreatedByAgenteId == currentUserId,
                        // Cambio de estado permitido si eres el dueño O el creador O el dueño de la transacción activa
                        x.Property.AgenteId == currentUserId || x.Property.CreatedByAgenteId == currentUserId || (x.ActiveTransaction != null && x.ActiveTransaction.AgenteId == currentUserId) || x.Property.EstadoComercial == "Disponible"
                    ),
                    x.ActiveTransaction))
                .FirstOrDefaultAsync();

            return propiedad is not null 
                ? Results.Ok(propiedad) 
                : Results.NotFound();
        })
        .WithTags("Propiedades")
        .WithName("ObtenerPropiedadPorId");
    }
}
