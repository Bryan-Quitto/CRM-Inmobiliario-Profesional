using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OpenAI.Chat;
using System.Text.Json;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public sealed class WhatsAppToolExecutor : IWhatsAppToolExecutor
{
    private readonly CrmDbContext _context;
    private readonly ILogger<WhatsAppToolExecutor> _logger;

    public WhatsAppToolExecutor(CrmDbContext context, ILogger<WhatsAppToolExecutor> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<string> HandleToolCallAsync(ChatToolCall toolCall, string customerPhone, string triggerMessage, Lead? currentLead)
    {
        _logger.LogInformation("Ejecutando herramienta: {ToolName} para {Phone}", toolCall.FunctionName, customerPhone);
        
        using JsonDocument args = JsonDocument.Parse(toolCall.FunctionArguments);

        try {
            return toolCall.FunctionName switch
            {
                "BuscarPropiedades" => await ExecBuscarPropiedades(args, customerPhone, triggerMessage, currentLead),
                "RegistrarNuevoLead" => await ExecRegistrarNuevoLead(args, customerPhone, triggerMessage),
                "RegistrarInteresProspecto" => await ExecRegistrarInteresProspecto(args, customerPhone, triggerMessage, currentLead),
                "SolicitarAsistenciaHumana" => await ExecSolicitarAsistenciaHumana(args, customerPhone, triggerMessage, currentLead),
                _ => "Error: Herramienta no encontrada."
            };
        } catch (Exception ex) {
            _logger.LogError(ex, "Error ejecutando herramienta {ToolName}", toolCall.FunctionName);
            return "Error al ejecutar la acción.";
        }
    }

    private async Task<string> ExecRegistrarInteresProspecto(JsonDocument args, string phone, string triggerMessage, Lead? lead)
    {
        if (!args.RootElement.TryGetProperty("propiedadId", out var pIdProp) || !Guid.TryParse(pIdProp.GetString(), out var propiedadId))
            return "Error: ID de propiedad inválido.";

        string nivel = args.RootElement.GetProperty("nivelInteres").GetString() ?? "Medio";
        
        if (nivel == "Descartada")
        {
            var conversation = await _context.WhatsappConversations.FirstOrDefaultAsync(c => c.Telefono == phone);
            if (conversation != null)
            {
                var history = conversation.HistorialJson.ToLower();
                if ((history.Contains("presupuesto") || history.Contains("$") || history.Contains("precio") || history.Contains("barat")) 
                    && !history.Contains("no me gusta") && !history.Contains("feo") && !history.Contains("descart") && !history.Contains("quitar"))
                {
                    _logger.LogWarning("Previendo descarte automático por presupuesto para {Phone}. Cambiando a 'Bajo'.", phone);
                    nivel = "Bajo";
                }
            }
        }

        if (lead == null) return "Error: El cliente debe estar registrado antes de marcar interés.";

        var interest = await _context.LeadPropertyInterests
            .FirstOrDefaultAsync(i => i.ClienteId == lead.Id && i.PropiedadId == propiedadId);

        if (interest == null)
        {
            interest = new LeadPropertyInterest
            {
                ClienteId = lead.Id,
                PropiedadId = propiedadId,
                NivelInteres = nivel,
                FechaRegistro = DateTimeOffset.UtcNow
            };
            _context.LeadPropertyInterests.Add(interest);
        }
        else
        {
            interest.NivelInteres = nivel;
            interest.FechaRegistro = DateTimeOffset.UtcNow;
        }

        await LogAiAction("RegistroInteres", args.RootElement.GetRawText(), phone, triggerMessage, lead.Id);
        
        return $"Interés registrado correctamente como '{nivel}'.";
    }

    private async Task<string> ExecBuscarPropiedades(JsonDocument args, string phone, string triggerMessage, Lead? lead)
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
            await LogAiAction("BusquedaPropiedades", args.RootElement.GetRawText(), phone, triggerMessage, lead?.Id);
            return JsonSerializer.Serialize(results);
        }

        if (maxBudget.HasValue && (!string.IsNullOrEmpty(type) || !string.IsNullOrEmpty(location)))
        {
            _logger.LogInformation("Nivel 1 fallido. Nivel 2: Ignorando presupuesto.");
            var query2 = _context.Properties.Where(p => allowedStates.Contains(p.EstadoComercial));
            if (!string.IsNullOrEmpty(type)) query2 = query2.Where(p => EF.Functions.ILike(p.TipoPropiedad, $"%{type}%"));
            if (!string.IsNullOrEmpty(location)) query2 = query2.Where(p => EF.Functions.ILike(p.Sector, $"%{location}%") || EF.Functions.ILike(p.Ciudad, $"%{location}%"));
            
            results = await query2.OrderBy(p => p.Precio).Take(3).Select(p => new { p.Id, p.Titulo, p.Precio, p.Sector, p.Ciudad, p.Direccion, p.Habitaciones, p.Banos, p.Estacionamientos, p.AniosAntiguedad, p.AreaTotal, p.AreaConstruccion, p.AreaTerreno, p.MediosBanos, p.UrlRemax, p.Operacion, p.TipoPropiedad, p.EstadoComercial, NotaIA = p.EstadoComercial == "Reservada" ? "RESERVADA: Avisar al cliente." : p.EstadoComercial == "Alquilada" ? "ALQUILADA: Avisar al cliente." : (string?)null }).ToListAsync();
            if (results.Any()) 
            {
                await LogAiAction("BusquedaPropiedades", args.RootElement.GetRawText(), phone, triggerMessage, lead?.Id);
                return "{\"Aviso\": \"No encontré opciones bajo ese presupuesto exacto, pero estas son las más económicas que cumplen con el tipo/ubicación:\", \"Resultados\": " + JsonSerializer.Serialize(results) + "}";
            }
        }

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
                await LogAiAction("BusquedaPropiedades", args.RootElement.GetRawText(), phone, triggerMessage, lead?.Id);
                return "{\"Aviso\": \"No encontré " + type + "s en esa zona/presupuesto, pero aquí tienes las " + type + "s más baratas del catálogo:\", \"Resultados\": " + JsonSerializer.Serialize(results) + "}";
            }
        }

        results = await _context.Properties
            .Where(p => allowedStates.Contains(p.EstadoComercial))
            .OrderBy(p => p.Precio).Take(3)
            .Select(p => new { p.Id, p.Titulo, p.Precio, p.Sector, p.Ciudad, p.Direccion, p.Habitaciones, p.Banos, p.Estacionamientos, p.AniosAntiguedad, p.AreaTotal, p.AreaConstruccion, p.AreaTerreno, p.MediosBanos, p.UrlRemax, p.Operacion, p.TipoPropiedad, p.EstadoComercial, NotaIA = p.EstadoComercial == "Reservada" ? "RESERVADA" : p.EstadoComercial == "Alquilada" ? "ALQUILADA" : (string?)null })
                .ToListAsync();

        if (results.Any()) 
        {
            await LogAiAction("BusquedaPropiedades", args.RootElement.GetRawText(), phone, triggerMessage, lead?.Id);
            return "{\"Aviso\": \"No encontré nada similar a tu búsqueda, pero estas son las ofertas más destacadas del momento:\", \"Resultados\": " + JsonSerializer.Serialize(results) + "}";
        }

        return "Lo siento, actualmente no tenemos ninguna propiedad disponible.";
    }

    private async Task<string> ExecRegistrarNuevoLead(JsonDocument args, string phone, string triggerMessage)
    {
        string nombre = args.RootElement.GetProperty("nombre").GetString() ?? "Desconocido";
        
        // Búsqueda inteligente para evitar duplicados en registro
        string searchPhone = phone.StartsWith("+") ? phone : "+" + phone;
        var existing = await _context.Leads.FirstOrDefaultAsync(l => l.Telefono == phone || l.Telefono == searchPhone);
        if (existing != null) return "El cliente ya está registrado.";

        // Intentar asignar al Admin ID estándar del proyecto
        var adminId = Guid.Parse("d4a6efdd-b801-40fb-901e-64e36f6b1400");
        var agent = await _context.Agents.FirstOrDefaultAsync(a => a.Id == adminId)
                    ?? await _context.Agents.OrderBy(a => a.FechaCreacion).FirstOrDefaultAsync();

        if (agent == null) return "No hay agentes disponibles para asignar.";

        var lead = new Lead
        {
            Id = Guid.NewGuid(),
            Nombre = nombre,
            Telefono = phone,
            Origen = "IA WhatsApp",
            AgenteId = agent.Id,
            FechaCreacion = DateTimeOffset.UtcNow,
            EtapaEmbudo = "Nuevo"
        };

        _context.Leads.Add(lead);
        await LogAiAction("Registro Lead", args.RootElement.GetRawText(), phone, triggerMessage, lead.Id);
        await _context.SaveChangesAsync();

        return "Cliente registrado correctamente.";
    }

    private async Task<string> ExecSolicitarAsistenciaHumana(JsonDocument args, string phone, string triggerMessage, Lead? lead)
    {
        string motivo = args.RootElement.GetProperty("motivo").GetString() ?? "No especificado";
        await LogAiAction("Alerta", args.RootElement.GetRawText(), phone, triggerMessage, lead?.Id);
        await _context.SaveChangesAsync();
        return "Solicitud de asistencia enviada al equipo humano.";
    }

    private async Task LogAiAction(string accion, string detalle, string phone, string triggerMessage, Guid? leadId = null)
    {
        var log = new AiActionLog
        {
            Id = Guid.NewGuid(),
            TelefonoCliente = phone,
            ClienteId = leadId,
            Accion = accion,
            DetalleJson = detalle,
            TriggerMessage = triggerMessage,
            Fecha = DateTimeOffset.UtcNow
        };
        _context.AiActionLogs.Add(log);
    }
}
