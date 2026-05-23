using System.Text.Json;
using System.Text;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Tools;

public sealed class BuscarPropiedadesHandler : BaseWhatsAppToolHandler
{
    public BuscarPropiedadesHandler(CrmDbContext context, ILogger<BuscarPropiedadesHandler> logger) 
        : base(context, logger) { }

    public override string ToolName => "BuscarPropiedades";

    public override async Task<string> ExecuteAsync(JsonDocument args, string phone, string triggerMessage, Contacto? contacto)
    {
        decimal? maxBudget = args.RootElement.TryGetProperty("presupuestoMaximo", out var b) ? b.GetDecimal() : null;
        decimal? minBudget = args.RootElement.TryGetProperty("presupuestoMinimo", out var mb) ? mb.GetDecimal() : null;
        string? type = args.RootElement.TryGetProperty("tipo", out var t) ? t.GetString() : null;
        string? location = args.RootElement.TryGetProperty("ubicacion", out var u) ? u.GetString() : null;
        string? keyword = args.RootElement.TryGetProperty("keyword", out var k) ? k.GetString() : null;
        int? rooms = args.RootElement.TryGetProperty("habitaciones", out var r) ? r.GetInt32() : null;
        string? operation = args.RootElement.TryGetProperty("operacion", out var o) ? o.GetString() : null;

        _logger.LogInformation("Iniciando búsqueda jerárquica: Tipo={Type}, Rango={Min}-{Max}, Ubicación={Location}, Keyword={Keyword}", 
            type ?? "Cualquiera", minBudget?.ToString() ?? "0", maxBudget?.ToString() ?? "Max", location ?? "Cualquiera", keyword ?? "Ninguna");

        var descartadosIds = await _context.ContactoInteresPropiedades
            .Where(i => i.Contacto!.Telefono == phone && i.NivelInteres == "Descartada")
            .Select(i => i.PropiedadId)
            .ToListAsync();

        var allowedStates = new[] { "Disponible", "Reservada", "Alquilada" };
        var query = _context.Properties
            .Where(p => allowedStates.Contains(p.EstadoComercial))
            .Where(p => !descartadosIds.Contains(p.Id));
        
        if (!string.IsNullOrEmpty(location))
        {
            var locLower = location.ToLower();
            if (locLower.Contains("ambato"))
            {
                query = query.Where(p => EF.Functions.ILike(EF.Functions.Unaccent(p.Ciudad), EF.Functions.Unaccent("%Ambato%")) || 
                                         EF.Functions.Unaccent(p.Sector) == "Ficoa" || EF.Functions.Unaccent(p.Sector) == "Ingahurco" || EF.Functions.Unaccent(p.Sector) == "Pinllo" || EF.Functions.Unaccent(p.Sector) == "Izamba");
            }
            else if (locLower.Contains("baños") || locLower.Contains("banos"))
            {
                query = query.Where(p => EF.Functions.ILike(EF.Functions.Unaccent(p.Ciudad), EF.Functions.Unaccent("%Baños%")) || 
                                         EF.Functions.Unaccent(p.Sector) == "Santa Ana" || EF.Functions.Unaccent(p.Sector) == "Illuchi" || EF.Functions.Unaccent(p.Sector) == "Agoyán");
            }
            else
            {
                query = query.Where(p => EF.Functions.ILike(EF.Functions.Unaccent(p.Sector), EF.Functions.Unaccent($"%{location}%")) || EF.Functions.ILike(EF.Functions.Unaccent(p.Ciudad), EF.Functions.Unaccent($"%{location}%")));
            }
        }

        if (!string.IsNullOrEmpty(type)) query = query.Where(p => EF.Functions.ILike(EF.Functions.Unaccent(p.TipoPropiedad), EF.Functions.Unaccent($"%{type}%")));

        var results = await query
            .OrderByDescending(p => !string.IsNullOrEmpty(keyword) && (p.Titulo.Contains(keyword) || p.Descripcion.Contains(keyword)))
            .ThenBy(p => p.Precio)
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

        // Nivel 2: Ignorar presupuesto
        if (maxBudget.HasValue && (!string.IsNullOrEmpty(type) || !string.IsNullOrEmpty(location)))
        {
            _logger.LogInformation("Nivel 1 fallido. Nivel 2: Ignorando presupuesto.");
            var query2 = _context.Properties.Where(p => allowedStates.Contains(p.EstadoComercial) && !descartadosIds.Contains(p.Id));
            if (!string.IsNullOrEmpty(type)) query2 = query2.Where(p => EF.Functions.ILike(EF.Functions.Unaccent(p.TipoPropiedad), EF.Functions.Unaccent($"%{type}%")));
            if (!string.IsNullOrEmpty(location)) query2 = query2.Where(p => EF.Functions.ILike(EF.Functions.Unaccent(p.Sector), EF.Functions.Unaccent($"%{location}%")) || EF.Functions.ILike(EF.Functions.Unaccent(p.Ciudad), EF.Functions.Unaccent($"%{location}%")));
            
            results = await query2.OrderBy(p => p.Precio).Take(3)
                .Select(p => new PropiedadResultDto(p.Id, p.Titulo, p.Precio, p.Sector, p.Ciudad, p.Direccion, p.Habitaciones, p.Banos, p.Estacionamientos, p.AniosAntiguedad, p.AreaTotal, p.AreaConstruccion, p.AreaTerreno, p.MediosBanos, p.UrlRemax, p.Operacion, p.TipoPropiedad, p.EstadoComercial, p.EstadoComercial == "Reservada" ? "RESERVADA" : p.EstadoComercial == "Alquilada" ? "ALQUILADA" : null))
                .ToListAsync();
                
            if (results.Any()) 
            {
                await LogAiActionAsync("BusquedaPropiedades", args.RootElement.GetRawText(), phone, triggerMessage, contacto?.Id);
                return FormatearCsv(results, "Aviso: No encontré opciones bajo ese presupuesto exacto, pero estas son las más económicas que cumplen con el tipo/ubicación:");
            }
        }

        // Nivel 3: Solo Tipo
        if (!string.IsNullOrEmpty(type))
        {
            _logger.LogInformation("Nivel 2 fallido. Nivel 3: Solo manteniendo Tipo={Type}", type);
            results = await _context.Properties
                .Where(p => allowedStates.Contains(p.EstadoComercial) && !descartadosIds.Contains(p.Id) && EF.Functions.ILike(EF.Functions.Unaccent(p.TipoPropiedad), EF.Functions.Unaccent($"%{type}%")))
                .OrderBy(p => p.Precio).Take(3)
                .Select(p => new PropiedadResultDto(p.Id, p.Titulo, p.Precio, p.Sector, p.Ciudad, p.Direccion, p.Habitaciones, p.Banos, p.Estacionamientos, p.AniosAntiguedad, p.AreaTotal, p.AreaConstruccion, p.AreaTerreno, p.MediosBanos, p.UrlRemax, p.Operacion, p.TipoPropiedad, p.EstadoComercial, p.EstadoComercial == "Reservada" ? "RESERVADA" : p.EstadoComercial == "Alquilada" ? "ALQUILADA" : null))
                .ToListAsync();
            
            if (results.Any()) 
            {
                await LogAiActionAsync("BusquedaPropiedades", args.RootElement.GetRawText(), phone, triggerMessage, contacto?.Id);
                return FormatearCsv(results, $"Aviso: No encontré {type}s en esa zona/presupuesto, pero aquí tienes las {type}s más baratas del catálogo:");
            }
        }

        // Nivel 4: Ofertas destacadas (cualquiera disponible)
        results = await _context.Properties
            .Where(p => allowedStates.Contains(p.EstadoComercial) && !descartadosIds.Contains(p.Id))
            .OrderBy(p => p.Precio).Take(3)
            .Select(p => new PropiedadResultDto(p.Id, p.Titulo, p.Precio, p.Sector, p.Ciudad, p.Direccion, p.Habitaciones, p.Banos, p.Estacionamientos, p.AniosAntiguedad, p.AreaTotal, p.AreaConstruccion, p.AreaTerreno, p.MediosBanos, p.UrlRemax, p.Operacion, p.TipoPropiedad, p.EstadoComercial, p.EstadoComercial == "Reservada" ? "RESERVADA" : p.EstadoComercial == "Alquilada" ? "ALQUILADA" : null))
            .ToListAsync();

        if (results.Any()) 
        {
            await LogAiActionAsync("BusquedaPropiedades", args.RootElement.GetRawText(), phone, triggerMessage, contacto?.Id);
            return FormatearCsv(results, "Aviso: No encontré nada similar a tu búsqueda, pero estas son las ofertas más destacadas del momento:");
        }

        return "Lo siento, actualmente no tenemos ninguna propiedad disponible.";
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
