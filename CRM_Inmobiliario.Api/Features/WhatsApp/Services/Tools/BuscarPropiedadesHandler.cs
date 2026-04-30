using System.Text.Json;
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

    public override async Task<string> ExecuteAsync(JsonDocument args, string phone, string triggerMessage, Lead? lead)
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

        var descartadosIds = await _context.LeadPropertyInterests
            .Where(i => i.Cliente!.Telefono == phone && i.NivelInteres == "Descartada")
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
                query = query.Where(p => EF.Functions.ILike(p.Ciudad, "%Ambato%") || 
                                         p.Sector == "Ficoa" || p.Sector == "Ingahurco" || p.Sector == "Pinllo" || p.Sector == "Izamba");
            }
            else if (locLower.Contains("baños") || locLower.Contains("banos"))
            {
                query = query.Where(p => EF.Functions.ILike(p.Ciudad, "%Baños%") || 
                                         p.Sector == "Santa Ana" || p.Sector == "Illuchi" || p.Sector == "Agoyán");
            }
            else
            {
                query = query.Where(p => EF.Functions.ILike(p.Sector, $"%{location}%") || EF.Functions.ILike(p.Ciudad, $"%{location}%"));
            }
        }

        if (!string.IsNullOrEmpty(type)) query = query.Where(p => EF.Functions.ILike(p.TipoPropiedad, $"%{type}%"));

        var results = await query
            .OrderByDescending(p => !string.IsNullOrEmpty(keyword) && (p.Titulo.Contains(keyword) || p.Descripcion.Contains(keyword)))
            .ThenBy(p => p.Precio)
            .Take(3)
            .Select(p => new { 
                p.Id, 
                p.Titulo, 
                p.Precio, 
                p.Sector, 
                p.Ciudad, 
                p.Direccion, 
                p.Habitaciones, 
                p.Banos, 
                p.Estacionamientos,
                p.AniosAntiguedad,
                p.AreaTotal,
                p.AreaConstruccion,
                p.AreaTerreno,
                p.MediosBanos,
                p.UrlRemax, 
                p.Operacion,
                p.TipoPropiedad,
                p.EstadoComercial,
                NotaIA = p.EstadoComercial == "Reservada" ? "INSTRUCCIÓN: Esta propiedad está RESERVADA. Usa este mensaje: 'Esta propiedad se encuentra actualmente RESERVADA. Un asesor te avisará si vuelve a estar disponible.'" :
                         p.EstadoComercial == "Alquilada" ? "INSTRUCCIÓN: Esta propiedad está ALQUILADA. Usa este mensaje: 'Esta propiedad se encuentra actualmente ALQUILADA. Un asesor te avisará si hay similares disponibles.'" : null
            })
            .ToListAsync();

        if (results.Any()) 
        {
            await LogAiActionAsync("BusquedaPropiedades", args.RootElement.GetRawText(), phone, triggerMessage, lead?.Id);
            return JsonSerializer.Serialize(results);
        }

        // Nivel 2: Ignorar presupuesto
        if (maxBudget.HasValue && (!string.IsNullOrEmpty(type) || !string.IsNullOrEmpty(location)))
        {
            _logger.LogInformation("Nivel 1 fallido. Nivel 2: Ignorando presupuesto.");
            var query2 = _context.Properties.Where(p => allowedStates.Contains(p.EstadoComercial));
            if (!string.IsNullOrEmpty(type)) query2 = query2.Where(p => EF.Functions.ILike(p.TipoPropiedad, $"%{type}%"));
            if (!string.IsNullOrEmpty(location)) query2 = query2.Where(p => EF.Functions.ILike(p.Sector, $"%{location}%") || EF.Functions.ILike(p.Ciudad, $"%{location}%"));
            
            results = await query2.OrderBy(p => p.Precio).Take(3).Select(p => new { p.Id, p.Titulo, p.Precio, p.Sector, p.Ciudad, p.Direccion, p.Habitaciones, p.Banos, p.Estacionamientos, p.AniosAntiguedad, p.AreaTotal, p.AreaConstruccion, p.AreaTerreno, p.MediosBanos, p.UrlRemax, p.Operacion, p.TipoPropiedad, p.EstadoComercial, NotaIA = p.EstadoComercial == "Reservada" ? "RESERVADA: Avisar al cliente." : p.EstadoComercial == "Alquilada" ? "ALQUILADA: Avisar al cliente." : (string?)null }).ToListAsync();
            if (results.Any()) 
            {
                await LogAiActionAsync("BusquedaPropiedades", args.RootElement.GetRawText(), phone, triggerMessage, lead?.Id);
                return "{\"Aviso\": \"No encontré opciones bajo ese presupuesto exacto, pero estas son las más económicas que cumplen con el tipo/ubicación:\", \"Resultados\": " + JsonSerializer.Serialize(results) + "}";
            }
        }

        // Nivel 3: Solo Tipo
        if (!string.IsNullOrEmpty(type))
        {
            _logger.LogInformation("Nivel 2 fallido. Nivel 3: Solo manteniendo Tipo={Type}", type);
            results = await _context.Properties
                .Where(p => allowedStates.Contains(p.EstadoComercial) && EF.Functions.ILike(p.TipoPropiedad, $"%{type}%"))
                .OrderBy(p => p.Precio).Take(3)
                .Select(p => new { p.Id, p.Titulo, p.Precio, p.Sector, p.Ciudad, p.Direccion, p.Habitaciones, p.Banos, p.Estacionamientos, p.AniosAntiguedad, p.AreaTotal, p.AreaConstruccion, p.AreaTerreno, p.MediosBanos, p.UrlRemax, p.Operacion, p.TipoPropiedad, p.EstadoComercial, NotaIA = p.EstadoComercial == "Reservada" ? "RESERVADA" : p.EstadoComercial == "Alquilada" ? "ALQUILADA" : (string?)null })
                .ToListAsync();
            
            if (results.Any()) 
            {
                await LogAiActionAsync("BusquedaPropiedades", args.RootElement.GetRawText(), phone, triggerMessage, lead?.Id);
                return "{\"Aviso\": \"No encontré " + type + "s en esa zona/presupuesto, pero aquí tienes las " + type + "s más baratas del catálogo:\", \"Resultados\": " + JsonSerializer.Serialize(results) + "}";
            }
        }

        // Nivel 4: Ofertas destacadas (cualquiera disponible)
        results = await _context.Properties
            .Where(p => allowedStates.Contains(p.EstadoComercial))
            .OrderBy(p => p.Precio).Take(3)
            .Select(p => new { p.Id, p.Titulo, p.Precio, p.Sector, p.Ciudad, p.Direccion, p.Habitaciones, p.Banos, p.Estacionamientos, p.AniosAntiguedad, p.AreaTotal, p.AreaConstruccion, p.AreaTerreno, p.MediosBanos, p.UrlRemax, p.Operacion, p.TipoPropiedad, p.EstadoComercial, NotaIA = p.EstadoComercial == "Reservada" ? "RESERVADA" : p.EstadoComercial == "Alquilada" ? "ALQUILADA" : (string?)null })
                .ToListAsync();

        if (results.Any()) 
        {
            await LogAiActionAsync("BusquedaPropiedades", args.RootElement.GetRawText(), phone, triggerMessage, lead?.Id);
            return "{\"Aviso\": \"No encontré nada similar a tu búsqueda, pero estas son las ofertas más destacadas del momento:\", \"Resultados\": " + JsonSerializer.Serialize(results) + "}";
        }

        return "Lo siento, actualmente no tenemos ninguna propiedad disponible.";
    }
}
