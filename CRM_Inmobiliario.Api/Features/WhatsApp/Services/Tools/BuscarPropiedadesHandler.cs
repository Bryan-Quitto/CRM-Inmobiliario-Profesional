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

    public override async Task<string> ExecuteAsync(JsonDocument args, string phone, string triggerMessage, Contacto? contacto)
    {
        string? queryStr = args.RootElement.TryGetProperty("query", out var q) ? q.GetString() : null;

        _logger.LogInformation("Iniciando búsqueda semántica: Query={Query}", queryStr ?? "Ninguno");

        if (string.IsNullOrEmpty(queryStr))
        {
            return "No se especificó un criterio de búsqueda.";
        }

        var descartadosIds = await _context.ContactoInteresPropiedades
            .Where(i => i.Contacto!.Telefono == phone && i.NivelInteres == "Descartada")
            .Select(i => i.PropiedadId)
            .ToListAsync();

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
            .OrderBy(p => p.VectorEmbedding!.CosineDistance(queryEmbedding))
            .Take(3)
            .Select(p => new PropiedadResultDto(
                p.Id, p.Titulo, p.Precio, p.Sector, p.Ciudad, p.Direccion, p.Habitaciones, p.Banos, p.Estacionamientos, p.AniosAntiguedad, 
                p.AreaTotal, p.AreaConstruccion, p.AreaTerreno, p.MediosBanos, p.UrlRemax, p.Operacion, p.TipoPropiedad, p.EstadoComercial,
                p.EstadoComercial == "Reservada" ? "INSTRUCCIÓN: Esta propiedad está RESERVADA. Usa este mensaje: 'Esta propiedad se encuentra actualmente RESERVADA. Un asesor te avisará si vuelve a estar disponible.'" :
                p.EstadoComercial == "Alquilada" ? "INSTRUCCIÓN: Esta propiedad está ALQUILADA. Usa este mensaje: 'Esta propiedad se encuentra actualmente ALQUILADA. Un asesor te avisará si hay similares disponibles.'" : null
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
        sb.AppendLine("Id|Titulo|Precio|Ubicacion|Operacion|Hab|Banos|Area|Url|NotaIA");
        foreach(var p in resultados)
        {
            var area = p.AreaTotal ?? p.AreaConstruccion ?? p.AreaTerreno;
            sb.AppendLine($"{p.Id}|{p.Titulo}|{p.Precio}|{p.Sector},{p.Ciudad}|{p.Operacion}|{p.Habitaciones}|{p.Banos}|{area}|{p.UrlRemax}|{p.NotaIA}");
        }
        return sb.ToString();
    }
}

public record PropiedadResultDto(Guid Id, string Titulo, decimal Precio, string? Sector, string? Ciudad, string? Direccion, int? Habitaciones, decimal? Banos, int? Estacionamientos, int? AniosAntiguedad, decimal? AreaTotal, decimal? AreaConstruccion, decimal? AreaTerreno, int? MediosBanos, string? UrlRemax, string? Operacion, string? TipoPropiedad, string? EstadoComercial, string? NotaIA);
