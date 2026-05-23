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
        bool EsCaptadorActivo,
        decimal PorcentajeComision,
        DateTimeOffset FechaIngreso,
        Guid? AgenteId,
        string AgenteNombre,
        Guid? PropietarioId,
        string? PropietarioNombre,
        Guid? CerradoConId,
        string? CerradoConNombre,
        decimal? PrecioCierre,
        decimal? PrecioReserva,
        IEnumerable<SectionResponse> Secciones,
        IEnumerable<MediaResponse> MediaSinSeccion,
        PropertyPermissions Permissions,
        ActiveTransactionInfo? ActiveTransaction,
        string Version);

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
                           (p.AgenteId == currentUserId || 
                            p.CreatedByAgenteId == currentUserId || 
                            (currentUserAgenciaId != null && p.AgenciaId == currentUserAgenciaId) ||
                            p.Transactions.Any(t => t.CreatedById == currentUserId)))
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
                    x.Property.EsCaptadorActivo,
                    x.Property.PorcentajeComision,
                    x.Property.FechaIngreso,
                    x.Property.AgenteId,
                    x.Property.Agente != null ? x.Property.Agente.Nombre + " " + x.Property.Agente.Apellido : string.Empty,
                    x.Property.PropietarioId,
                    x.Property.Propietario != null ? x.Property.Propietario.Nombre + " " + x.Property.Propietario.Apellido : null,
                    x.Property.CerradoConId,
                    x.Property.CerradoCon != null ? x.Property.CerradoCon.Nombre + " " + x.Property.CerradoCon.Apellido : null,
                    x.Property.PrecioCierre,
                    x.Property.PrecioReserva,
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
                        // Permiso de edición si:
                        // 1. Eres el captador Y está marcado como activo
                        // 2. Eres el creador Y el captador está marcado como inactivo (o no hay captador)
                        (x.Property.AgenteId == currentUserId && x.Property.EsCaptadorActivo) || 
                        (x.Property.CreatedByAgenteId == currentUserId && (!x.Property.EsCaptadorActivo || x.Property.AgenteId == null)),
                        
                        (x.Property.AgenteId == currentUserId && x.Property.EsCaptadorActivo) || 
                        (x.Property.CreatedByAgenteId == currentUserId && (!x.Property.EsCaptadorActivo || x.Property.AgenteId == null)),
                        
                        // Cambio de estado permitido SI Y SOLO SI:
                        // Eres el dueño/gestor según la regla de Agente Activo.
                        // El autor de la transacción (quien la vendió/reservó) YA NO tiene este permiso.
                        (x.Property.AgenteId == currentUserId && x.Property.EsCaptadorActivo) || 
                        (x.Property.CreatedByAgenteId == currentUserId && (!x.Property.EsCaptadorActivo || x.Property.AgenteId == null))
                    ),
                    x.ActiveTransaction,
                    x.Property.Version.ToString()))
                .FirstOrDefaultAsync();

            return propiedad is not null 
                ? Results.Ok(propiedad) 
                : Results.NotFound();
        })
        .WithTags("Propiedades")
        .WithName("ObtenerPropiedadPorId");
    }
}
