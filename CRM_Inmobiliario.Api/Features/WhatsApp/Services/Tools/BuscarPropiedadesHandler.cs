using System.Text.Json;
using System.Text;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pgvector.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Tools;

public sealed class BuscarPropiedadesHandler : BaseWhatsAppToolHandler
{
    private readonly CRM_Inmobiliario.Api.Features.Propiedades.Services.IPropertyEmbeddingService _embeddingService;

    public BuscarPropiedadesHandler(CrmDbContext context, ILogger<BuscarPropiedadesHandler> logger, CRM_Inmobiliario.Api.Features.Propiedades.Services.IPropertyEmbeddingService embeddingService) 
        : base(context, logger) 
    { 
        _embeddingService = embeddingService;
    }

    public override string ToolName => "BuscarPropiedades";

    public override async Task<string> ExecuteAsync(JsonDocument args, string phone, string triggerMessage, Contacto? contacto, string phoneNumberId)
    {
        string? queryStr = args.RootElement.TryGetProperty("query", out var q) ? q.GetString() : null;
        string? tipoOperacion = args.RootElement.TryGetProperty("tipoOperacion", out var to) ? to.GetString() : null;
        decimal? presupuestoMaximo = args.RootElement.TryGetProperty("presupuestoMaximo", out var pm) && pm.ValueKind == JsonValueKind.Number ? pm.GetDecimal() : null;
        int? habitacionesMinimas = args.RootElement.TryGetProperty("habitacionesMinimas", out var hm) && hm.ValueKind == JsonValueKind.Number ? hm.GetInt32() : null;
        int? antiguedadMaxima = args.RootElement.TryGetProperty("antiguedadMaxima", out var am) && am.ValueKind == JsonValueKind.Number ? am.GetInt32() : null;

        _logger.LogInformation("Iniciando búsqueda híbrida: Query={Query}, Tipo={Tipo}, Presupuesto={Presupuesto}, Habitaciones={Habitaciones}, Antiguedad={Antiguedad}", 
            queryStr ?? "Ninguno", tipoOperacion ?? "Cualquiera", presupuestoMaximo, habitacionesMinimas, antiguedadMaxima);

        if (string.IsNullOrEmpty(queryStr))
        {
            return "No se especificó un criterio de búsqueda.";
        }

        var descartadosIds = await _context.ContactoInteresPropiedades
            .Where(i => i.Contacto!.Telefono == phone && i.NivelInteres == "Descartada")
            .Select(i => i.PropiedadId)
            .ToListAsync();

        Guid? currentAgentId = null;
        Guid? currentAgencyId = null;

        if (!string.IsNullOrEmpty(phoneNumberId))
        {
            var agent = await _context.Agents.FirstOrDefaultAsync(a => a.WhatsAppPhoneNumberId == phoneNumberId);
            if (agent != null)
            {
                currentAgentId = agent.Id;
                currentAgencyId = agent.AgenciaId;
            }
        }

        var allowedStates = new[] { "Disponible", "Reservada", "Alquilada" };
        
        var queryEmbedding = await _embeddingService.GenerateEmbeddingAsync(queryStr);
        if (queryEmbedding == null) 
        {
            _logger.LogWarning("No se pudo generar el embedding para la búsqueda semántica.");
            return "El servicio de búsqueda avanzada no está disponible temporalmente.";
        }

        var results = await _context.Properties
            .Where(p => allowedStates.Contains(p.EstadoComercial))
            .Where(p => !descartadosIds.Contains(p.Id))
            .Where(p => p.VectorEmbedding != null)
            // Filtros duros (Hybrid Search)
            .Where(p => string.IsNullOrEmpty(tipoOperacion) || p.Operacion == tipoOperacion)
            .Where(p => !presupuestoMaximo.HasValue || p.Precio <= presupuestoMaximo.Value)
            .Where(p => !habitacionesMinimas.HasValue || p.Habitaciones >= habitacionesMinimas.Value)
            .Where(p => !antiguedadMaxima.HasValue || p.AniosAntiguedad == null || p.AniosAntiguedad <= antiguedadMaxima.Value)
            // Regla de Visibilidad (Data Tenancy): Agencia completa o solo suyas si es independiente
            .Where(p => 
                (currentAgencyId != null && p.AgenciaId == currentAgencyId) || 
                (currentAgentId != null && (p.AgenteId == currentAgentId || p.CreatedByAgenteId == currentAgentId)))
            .OrderBy(p => p.VectorEmbedding!.CosineDistance(queryEmbedding))
            .Take(3)
            .Select(p => new PropiedadResultDto(
                p.Id, p.Titulo, p.Precio, p.Sector, p.Ciudad, p.Direccion, p.Habitaciones, p.Banos, p.Estacionamientos, p.AniosAntiguedad, 
                p.AreaTotal, p.AreaConstruccion, p.AreaTerreno, p.MediosBanos, p.UrlRemax, p.Operacion, p.TipoPropiedad, p.EstadoComercial,
                p.EstadoComercial == "Reservada" ? "INSTRUCCIÓN: Esta propiedad está RESERVADA. Usa este mensaje: 'Esta propiedad se encuentra actualmente RESERVADA. Un asesor te avisará si vuelve a estar disponible.'" :
                p.EstadoComercial == "Alquilada" ? "INSTRUCCIÓN: Esta propiedad está ALQUILADA. Usa este mensaje: 'Esta propiedad se encuentra actualmente ALQUILADA. Un asesor te avisará si hay similares disponibles.'" : null,
                p.Descripcion
            )).ToListAsync();

        if (results.Any()) 
        {
            await LogAiActionAsync("BusquedaPropiedades", args.RootElement.GetRawText(), phone, triggerMessage, contacto?.Id);
            return FormatearCsv(results);
        }

        return "No encontré propiedades que coincidan con tu búsqueda semántica.";
    }

    private string FormatearCsv(IEnumerable<PropiedadResultDto> resultados, string aviso = "")
    {
        var sb = new StringBuilder();
        if (!string.IsNullOrEmpty(aviso)) sb.AppendLine(aviso);
        sb.AppendLine("Id|Titulo|Tipo|Precio|Ubicacion|Operacion|Habitaciones|Baños|MediosBaños|Parqueaderos|AñosAntigüedad|Area|Url|NotaIA|DescripcionSanitizada");
        foreach(var p in resultados)
        {
            var area = p.AreaTotal ?? p.AreaConstruccion ?? p.AreaTerreno;
            var desc = p.Descripcion?.Replace("\n", " ").Replace("\r", " ").Replace("|", "-") ?? "";
            if (desc.Length > 800) desc = desc.Substring(0, 800) + "...";
            var medBan = p.MediosBanos?.ToString() ?? "0";
            var estac = p.Estacionamientos?.ToString() ?? "0";
            var anios = p.AniosAntiguedad?.ToString() ?? "N/A";
            var tipo = p.TipoPropiedad ?? "N/A";
            sb.AppendLine($"{p.Id}|{p.Titulo}|{tipo}|{p.Precio}|{p.Sector},{p.Ciudad}|{p.Operacion}|{p.Habitaciones}|{p.Banos}|{medBan}|{estac}|{anios}|{area}|{p.UrlRemax}|{p.NotaIA}|{desc}");
        }
        return sb.ToString();
    }
}

public record PropiedadResultDto(Guid Id, string Titulo, decimal Precio, string? Sector, string? Ciudad, string? Direccion, int? Habitaciones, decimal? Banos, int? Estacionamientos, int? AniosAntiguedad, decimal? AreaTotal, decimal? AreaConstruccion, decimal? AreaTerreno, int? MediosBanos, string? UrlRemax, string? Operacion, string? TipoPropiedad, string? EstadoComercial, string? NotaIA, string? Descripcion);
