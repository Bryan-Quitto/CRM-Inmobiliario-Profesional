using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools;
using System.Text.Json;
using System.Text;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Tools;

public sealed class ConsultarDetallesPropiedadHandler : BaseCoreAiToolHandler
{
    public ConsultarDetallesPropiedadHandler(Microsoft.EntityFrameworkCore.IDbContextFactory<CrmDbContext> dbContextFactory, ILogger<ConsultarDetallesPropiedadHandler> logger) 
        : base(dbContextFactory, logger) 
    { 
    }

    public override string ToolName => "ConsultarDetallesPropiedad";

    public override async Task<string> ExecuteAsync(JsonDocument args, ToolExecutionContext context, System.Threading.CancellationToken cancellationToken = default)
    {
        await using var _context = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        string? propiedadIdStr = args.RootElement.TryGetProperty("propiedadId", out var pid) ? pid.GetString() : null;

        _logger.LogInformation("Iniciando consulta profunda de propiedad: ID={PropiedadId}", propiedadIdStr ?? "Ninguno");

        if (string.IsNullOrEmpty(propiedadIdStr) || !Guid.TryParse(propiedadIdStr, out var propiedadId))
        {
            return "No se especificó un ID válido de la propiedad a consultar.";
        }

        var propiedad = await _context.Properties.FirstOrDefaultAsync(p => p.Id == propiedadId);

        if (propiedad == null)
        {
            return "No encontré ninguna propiedad con ese ID en la base de datos.";
        }

        await LogAiActionAsync("ConsultaDetallesPropiedad", args.RootElement.GetRawText(), context);

        var sb = new StringBuilder();
        sb.AppendLine($"--- DETALLES PROFUNDOS DE LA PROPIEDAD: {propiedad.Id} ---");
        sb.AppendLine($"Título: {propiedad.Titulo}");
        sb.AppendLine($"Operación: {propiedad.Operacion}");
        sb.AppendLine($"Tipo: {propiedad.TipoPropiedad}");
        sb.AppendLine($"Precio: ${propiedad.Precio}");
        sb.AppendLine($"Estado Comercial: {propiedad.EstadoComercial}");
        sb.AppendLine($"Ciudad: {propiedad.Ciudad}");
        sb.AppendLine($"Sector: {propiedad.Sector}");
        sb.AppendLine($"Dirección Exacta: {propiedad.Direccion}");
        sb.AppendLine($"Google Maps: {propiedad.GoogleMapsUrl ?? "No disponible"}");
        sb.AppendLine($"Habitaciones: {propiedad.Habitaciones}");
        sb.AppendLine($"Baños Completos: {propiedad.Banos}");
        sb.AppendLine($"Medios Baños: {propiedad.MediosBanos?.ToString() ?? "N/A"}");
        sb.AppendLine($"Estacionamientos: {propiedad.Estacionamientos?.ToString() ?? "N/A"}");
        sb.AppendLine($"Años de Antigüedad: {propiedad.AniosAntiguedad?.ToString() ?? "No especificado"}");
        sb.AppendLine($"Área Total: {propiedad.AreaTotal} m2");
        sb.AppendLine($"Área de Terreno: {propiedad.AreaTerreno?.ToString() ?? "N/A"} m2");
        sb.AppendLine($"Área de Construcción: {propiedad.AreaConstruccion?.ToString() ?? "N/A"} m2");
        sb.AppendLine($"Enlace Web: {propiedad.UrlRemax ?? "No disponible"}");
        sb.AppendLine($"--- DESCRIPCIÓN COMPLETA ---");
        sb.AppendLine(propiedad.Descripcion);
        
        sb.AppendLine("\nINSTRUCCIÓN CRÍTICA PARA LA IA: Acabas de solicitar los detalles profundos de esta propiedad. Lee cuidadosamente la descripción de arriba. Si el dato que el cliente preguntó (ej. años, un árbol, parqueos) SÍ está en el texto, respóndele afirmativamente basándote en esta información. CONFÍA en estos datos, no te confundas con propiedades de las que hablaron antes.");

        return sb.ToString();
    }
}





