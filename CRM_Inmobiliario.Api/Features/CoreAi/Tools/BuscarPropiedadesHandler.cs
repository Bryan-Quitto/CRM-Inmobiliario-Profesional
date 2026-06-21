using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools;
using System.Text.Json;
using System.Text;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pgvector.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.CoreAi.Tools;

public sealed class BuscarPropiedadesHandler : BaseCoreAiToolHandler
{
    private readonly CRM_Inmobiliario.Api.Features.Propiedades.Services.IPropertyEmbeddingService _embeddingService;

    public BuscarPropiedadesHandler(Microsoft.EntityFrameworkCore.IDbContextFactory<CrmDbContext> dbContextFactory, ILogger<BuscarPropiedadesHandler> logger, CRM_Inmobiliario.Api.Features.Propiedades.Services.IPropertyEmbeddingService embeddingService) 
        : base(dbContextFactory, logger) 
    { 
        _embeddingService = embeddingService;
    }

    public override string ToolName => "BuscarPropiedades";

    public override async Task<string> ExecuteAsync(JsonDocument args, ToolExecutionContext context, System.Threading.CancellationToken cancellationToken = default)
    {
        await using var _context = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        string queryStr = ExtractSafeString(args.RootElement, "query", 500, string.Empty);
        string tipoOperacion = ExtractSafeString(args.RootElement, "tipoOperacion", 50, string.Empty);
        string ciudad = ExtractSafeString(args.RootElement, "ciudad", 100, string.Empty);
        string sector = ExtractSafeString(args.RootElement, "sector", 100, string.Empty);

        decimal? presupuestoMaximo = null;
        if (args.RootElement.TryGetProperty("presupuestoMaximo", out _))
        {
            if (!TryExtractSafeDecimal(args.RootElement, "presupuestoMaximo", out var pm, out var error, 0, 1000000000m)) return error;
            presupuestoMaximo = pm;
        }

        int? habitacionesMinimas = null;
        if (args.RootElement.TryGetProperty("habitacionesMinimas", out _))
        {
            if (!TryExtractSafeDecimal(args.RootElement, "habitacionesMinimas", out var hm, out var error, 0, 50)) return error;
            habitacionesMinimas = (int)hm;
        }

        int? antiguedadMaxima = null;
        if (args.RootElement.TryGetProperty("antiguedadMaxima", out _))
        {
            if (!TryExtractSafeDecimal(args.RootElement, "antiguedadMaxima", out var am, out var error, 0, 200)) return error;
            antiguedadMaxima = (int)am;
        }

        _logger.LogInformation("Iniciando búsqueda híbrida: Query={Query}, Tipo={Tipo}, Presupuesto={Presupuesto}, Habitaciones={Habitaciones}, Antiguedad={Antiguedad}, Ciudad={Ciudad}, Sector={Sector}", 
            queryStr ?? "Ninguno", tipoOperacion ?? "Cualquiera", presupuestoMaximo, habitacionesMinimas, antiguedadMaxima, ciudad ?? "Ninguna", sector ?? "Ninguno");

        if (string.IsNullOrEmpty(queryStr))
        {
            return "No se especificó un criterio de búsqueda.";
        }

        var descartadosIds = new List<Guid>();
        if (context.ContactoId.HasValue)
        {
            descartadosIds = await _context.ContactoInteresPropiedades
                .Where(i => i.ContactoId == context.ContactoId.Value && i.NivelInteres == "Descartada")
                .Select(i => i.PropiedadId)
                .ToListAsync();
        }

        Guid? currentAgentId = null;
        Guid? currentAgencyId = null;

        string? provider = null;
        string? apiKey = null;

        var agent = await ResolveIdentityAsync(context, cancellationToken);
        if (agent != null)
        {
            currentAgentId = agent.Id;
            currentAgencyId = agent.AgenciaId;
            provider = agent.ActiveLLMProvider;
            apiKey = agent.AiApiKey;
        }

        var allowedStates = new[] { "Disponible", "Reservada", "Alquilada" };
        
        // Combinamos el query resumido de la IA con el mensaje original del usuario para no perder contexto semántico (Capa 1)
        string semanticQuery = $"{queryStr} {context.TriggerMessage}".Trim();

        var queryEmbedding = await _embeddingService.GenerateEmbeddingAsync(semanticQuery, provider ?? "OpenAI", apiKey);
        if (queryEmbedding == null) 
        {
            _logger.LogWarning("No se pudo generar el embedding para la búsqueda semántica.");
            return "El servicio de búsqueda avanzada no está disponible temporalmente.";
        }

        var baseQuery = _context.Properties
            .Where(p => allowedStates.Contains(p.EstadoComercial))

            .Where(p => !descartadosIds.Contains(p.Id))
            // Filtros duros (Hybrid Search)
            .Where(p => string.IsNullOrEmpty(tipoOperacion) || p.Operacion == tipoOperacion)
            .Where(p => string.IsNullOrEmpty(ciudad) || EF.Functions.ILike(p.Ciudad, $"%{ciudad}%"))
            .Where(p => string.IsNullOrEmpty(sector) || EF.Functions.ILike(p.Sector, $"%{sector}%"))
            // Tolerancia del 15% para que "ronde" el presupuesto
            .Where(p => !presupuestoMaximo.HasValue || p.Precio <= presupuestoMaximo.Value * 1.15m)
            .Where(p => !habitacionesMinimas.HasValue || p.Habitaciones >= habitacionesMinimas.Value)
            .Where(p => !antiguedadMaxima.HasValue || p.AniosAntiguedad == null || p.AniosAntiguedad <= antiguedadMaxima.Value);

        // Regla de Visibilidad (Data Tenancy): Agencia completa o solo suyas si es independiente
        if (currentAgencyId != null || currentAgentId != null)
        {
            baseQuery = baseQuery.Where(p => 
                (currentAgencyId != null && p.AgenciaId == currentAgencyId) || 
                (currentAgentId != null && (p.AgenteId == currentAgentId || p.CreatedByAgenteId == currentAgentId)));
        }

        // Filtro de Ocultamiento IA: Excluir propiedades archivadas por el agente actual
        if (currentAgentId != null)
        {
            var archivedByAgentIds = _context.AgentArchivedProperties
                .Where(a => a.AgentId == currentAgentId)
                .Select(a => a.PropiedadId);
                
            baseQuery = baseQuery.Where(p => !archivedByAgentIds.Contains(p.Id));
        }

        List<PropiedadResultDto> results;

        if (_context.Database.IsRelational())
        {
            if (provider == "Gemini")
            {
                results = await baseQuery
                    .Where(p => p.GeminiEmbedding != null)
                    .Where(p => p.GeminiEmbedding!.CosineDistance(queryEmbedding) < 0.45)
                    .OrderBy(p => p.GeminiEmbedding!.CosineDistance(queryEmbedding))
                    .Take(3)
                    .Select(p => new PropiedadResultDto(
                        p.Id, p.Titulo, p.Precio, p.Sector, p.Ciudad, p.Direccion, p.Habitaciones, p.Banos, p.Estacionamientos, p.AniosAntiguedad, 
                        p.AreaTotal, p.AreaConstruccion, p.AreaTerreno, p.MediosBanos, p.UrlRemax, p.Operacion, p.TipoPropiedad, p.EstadoComercial,
                        p.EstadoComercial == "Reservada" ? "INSTRUCCIÓN: Esta propiedad está RESERVADA. Usa este mensaje: 'Esta propiedad se encuentra actualmente RESERVADA. Un asesor te avisará si vuelve a estar disponible.'" :
                        p.EstadoComercial == "Alquilada" ? "INSTRUCCIÓN: Esta propiedad está ALQUILADA. Usa este mensaje: 'Esta propiedad se encuentra actualmente ALQUILADA. Un asesor te avisará si hay similares disponibles.'" : null,
                        p.Descripcion
                    )).ToListAsync();
            }
            else
            {
                results = await baseQuery
                    .Where(p => p.VectorEmbedding != null)
                    .Where(p => p.VectorEmbedding!.CosineDistance(queryEmbedding) < 0.45)
                    .OrderBy(p => p.VectorEmbedding!.CosineDistance(queryEmbedding))
                    .Take(3)
                    .Select(p => new PropiedadResultDto(
                        p.Id, p.Titulo, p.Precio, p.Sector, p.Ciudad, p.Direccion, p.Habitaciones, p.Banos, p.Estacionamientos, p.AniosAntiguedad, 
                        p.AreaTotal, p.AreaConstruccion, p.AreaTerreno, p.MediosBanos, p.UrlRemax, p.Operacion, p.TipoPropiedad, p.EstadoComercial,
                        p.EstadoComercial == "Reservada" ? "INSTRUCCIÓN: Esta propiedad está RESERVADA. Usa este mensaje: 'Esta propiedad se encuentra actualmente RESERVADA. Un asesor te avisará si vuelve a estar disponible.'" :
                        p.EstadoComercial == "Alquilada" ? "INSTRUCCIÓN: Esta propiedad está ALQUILADA. Usa este mensaje: 'Esta propiedad se encuentra actualmente ALQUILADA. Un asesor te avisará si hay similares disponibles.'" : null,
                        p.Descripcion
                    )).ToListAsync();
            }
        }
        else
        {
            // En memoria o en entornos no relacionales, omitimos la búsqueda vectorial porque los campos son ignorados
            results = new List<PropiedadResultDto>();
        }

        // Fallback: Full Text Search if Semantic Search is too strict or fails
        if (!results.Any())
        {
            var keywords = queryStr.Split(' ', StringSplitOptions.RemoveEmptyEntries)
                                   .Where(k => k.Length > 3)
                                   .OrderByDescending(k => k.Length)
                                   .Take(2)
                                   .ToList();

            if (keywords.Any())
            {
                var fallbackQuery = baseQuery;
                foreach (var kw in keywords)
                {
                    string keywordLower = kw.ToLower();
                    fallbackQuery = fallbackQuery.Where(p => 
                        (p.Descripcion != null && p.Descripcion.ToLower().Contains(keywordLower)) || 
                        (p.Titulo != null && p.Titulo.ToLower().Contains(keywordLower)));
                }

                results = await fallbackQuery
                    .OrderByDescending(p => p.Id)
                    .Take(3)
                    .Select(p => new PropiedadResultDto(
                        p.Id, p.Titulo, p.Precio, p.Sector, p.Ciudad, p.Direccion, p.Habitaciones, p.Banos, p.Estacionamientos, p.AniosAntiguedad, 
                        p.AreaTotal, p.AreaConstruccion, p.AreaTerreno, p.MediosBanos, p.UrlRemax, p.Operacion, p.TipoPropiedad, p.EstadoComercial,
                        p.EstadoComercial == "Reservada" ? "INSTRUCCIÓN: Esta propiedad está RESERVADA. Usa este mensaje: 'Esta propiedad se encuentra actualmente RESERVADA. Un asesor te avisará si vuelve a estar disponible.'" :
                        p.EstadoComercial == "Alquilada" ? "INSTRUCCIÓN: Esta propiedad está ALQUILADA. Usa este mensaje: 'Esta propiedad se encuentra actualmente ALQUILADA. Un asesor te avisará si hay similares disponibles.'" : null,
                        p.Descripcion
                    )).ToListAsync();
            }
        }

        if (results.Any()) 
        {
            await LogAiActionAsync("BusquedaPropiedades", args.RootElement.GetRawText(), context);
            
            if (context.Channel == "Copilot")
            {
                var minifiedResults = results.Select(r => new
                {
                    r.Id,
                    r.Titulo,
                    r.Precio,
                    r.Sector,
                    r.Ciudad,
                    r.Habitaciones,
                    r.Banos,
                    r.Operacion
                });
                return JsonSerializer.Serialize(minifiedResults);
            }

            return FormatearCsv(results);
        }

        return "No encontré propiedades que coincidan con tu búsqueda semántica.";
    }

    private string FormatearCsv(IEnumerable<PropiedadResultDto> resultados, string aviso = "")
    {
        var sb = new StringBuilder();
        if (!string.IsNullOrEmpty(aviso)) sb.AppendLine(aviso);
        sb.AppendLine("Id|Titulo|Tipo|Precio|Ubicacion|DireccionExacta|Operacion|Habitaciones|Baños|MediosBaños|Parqueaderos|AñosAntigüedad|Area|Url|NotaIA|DescripcionSanitizada");
        foreach(var p in resultados)
        {
            var area = p.AreaTotal ?? p.AreaConstruccion ?? p.AreaTerreno;
            var desc = p.Descripcion?.Replace("\n", " ").Replace("\r", " ").Replace("|", "-") ?? "";
            if (desc.Length > 800) desc = desc.Substring(0, 800) + "...";
            var medBan = p.MediosBanos?.ToString() ?? "0";
            var estac = p.Estacionamientos?.ToString() ?? "0";
            var anios = p.AniosAntiguedad?.ToString() ?? "N/A";
            var tipo = p.TipoPropiedad ?? "N/A";
            var direccion = p.Direccion?.Replace("|", "-") ?? "";
            sb.AppendLine($"{p.Id}|{p.Titulo}|{tipo}|{p.Precio}|{p.Sector},{p.Ciudad}|{direccion}|{p.Operacion}|{p.Habitaciones}|{p.Banos}|{medBan}|{estac}|{anios}|{area}|{p.UrlRemax}|{p.NotaIA}|{desc}");
        }
        return sb.ToString();
    }
}

public record PropiedadResultDto(Guid Id, string Titulo, decimal Precio, string? Sector, string? Ciudad, string? Direccion, int? Habitaciones, decimal? Banos, int? Estacionamientos, int? AniosAntiguedad, decimal? AreaTotal, decimal? AreaConstruccion, decimal? AreaTerreno, int? MediosBanos, string? UrlRemax, string? Operacion, string? TipoPropiedad, string? EstadoComercial, string? NotaIA, string? Descripcion);





