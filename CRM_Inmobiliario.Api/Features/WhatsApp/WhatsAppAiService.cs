using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OpenAI.Chat;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Net.Http.Headers;

namespace CRM_Inmobiliario.Api.Features.WhatsApp;

public sealed class WhatsAppAiService
{
    private readonly CrmDbContext _context;
    private readonly ILogger<WhatsAppAiService> _logger;
    private readonly HttpClient _httpClient;
    private readonly string? _openAiApiKey;
    private readonly string? _whatsappToken;
    private readonly string? _whatsappPhoneId;

    public WhatsAppAiService(
        CrmDbContext context,
        ILogger<WhatsAppAiService> logger,
        HttpClient httpClient)
    {
        _context = context;
        _logger = logger;
        _httpClient = httpClient;
        _openAiApiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY")?.Trim().Trim('"');
        _whatsappToken = Environment.GetEnvironmentVariable("WHATSAPP_ACCESS_TOKEN")?.Trim().Trim('"');
        _whatsappPhoneId = Environment.GetEnvironmentVariable("WHATSAPP_PHONE_NUMBER_ID")?.Trim().Trim('"');
    }

    public async Task ProcessIncomingMessageAsync(string phone, string messageText)
    {
        try
        {
            _logger.LogInformation("Procesando mensaje de {Phone}: {Message}", phone, messageText);

            // 1. Obtener o crear conversación
            var conversation = await _context.WhatsappConversations
                .FirstOrDefaultAsync(c => c.Telefono == phone);

            List<ChatMessage> history;
            if (conversation == null)
            {
                history = new List<ChatMessage> { new SystemChatMessage(GetSystemPrompt()) };
                conversation = new WhatsappConversation
                {
                    Telefono = phone,
                    HistorialJson = SerializeHistory(history),
                    UltimaActualizacion = DateTimeOffset.UtcNow
                };
                _context.WhatsappConversations.Add(conversation);
            }
            else
            {
                history = DeserializeHistory(conversation.HistorialJson);
            }

            // 2. Añadir mensaje del usuario
            history.Add(new UserChatMessage(messageText));

            // --- CONTROL DE COSTOS (INPUT): Ventana deslizante de historial ---
            // Mantenemos solo los últimos 10 mensajes para evitar prompts gigantescos,
            // pero nos aseguramos de que el SystemPrompt siempre esté al inicio (índice 0).
            if (history.Count > 12) 
            {
                var systemMessage = history[0];
                history = history.Skip(history.Count - 10).ToList();
                history.Insert(0, systemMessage);
            }

            // 3. Inferencia con OpenAI y Function Calling
            var chatClient = new ChatClient("gpt-4o-mini", _openAiApiKey);
            var options = GetChatOptions();

            bool requiresAction = true;
            string? finalResponse = null;

            while (requiresAction)
            {
                // LOG DE TRAZABILIDAD: Ver qué le mandamos a la IA
                _logger.LogInformation("--- ENVIANDO A OPENAI (Historia acumulada: {Count} mensajes) ---", history.Count);
                
                ChatCompletion completion = await chatClient.CompleteChatAsync(history, options);
                requiresAction = false;

                // LOG DE COSTOS: Ver tokens consumidos
                _logger.LogInformation("--- CONSUMO DE TOKENS: Input={Input}, Output={Output}, Total={Total} ---", 
                    completion.Usage.InputTokenCount, completion.Usage.OutputTokenCount, completion.Usage.TotalTokenCount);

                switch (completion.FinishReason)
                {
                    case ChatFinishReason.Stop:
                        finalResponse = completion.Content[0].Text;
                        history.Add(new AssistantChatMessage(completion));
                        _logger.LogInformation("--- RESPUESTA FINAL IA: {Response} ---", finalResponse);
                        break;

                    case ChatFinishReason.ToolCalls:
                        history.Add(new AssistantChatMessage(completion.ToolCalls));
                        foreach (var toolCall in completion.ToolCalls)
                        {
                            _logger.LogInformation("--- IA DECIDIÓ LLAMAR A: {Tool} con ARGS: {Args} ---", toolCall.FunctionName, toolCall.FunctionArguments);
                            string toolResult = await HandleToolCallAsync(toolCall, phone);
                            _logger.LogInformation("--- RESULTADO DE LA HERRAMIENTA: {Result} ---", toolResult);
                            history.Add(new ToolChatMessage(toolCall.Id, toolResult));
                        }
                        requiresAction = true;
                        break;
                }
            }

            // 4. Guardar historial actualizado
            conversation.HistorialJson = SerializeHistory(history);
            conversation.UltimaActualizacion = DateTimeOffset.UtcNow;
            await _context.SaveChangesAsync();

            // 5. Enviar respuesta a WhatsApp
            if (!string.IsNullOrEmpty(finalResponse))
            {
                await SendWhatsAppMessageAsync(phone, finalResponse);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error procesando mensaje de WhatsApp para {Phone}", phone);
        }
    }

    private async Task<string> HandleToolCallAsync(ChatToolCall toolCall, string customerPhone)
    {
        _logger.LogInformation("Ejecutando herramienta: {ToolName} para {Phone}", toolCall.FunctionName, customerPhone);
        
        using JsonDocument args = JsonDocument.Parse(toolCall.FunctionArguments);

        try {
            switch (toolCall.FunctionName)
            {
                case "BuscarPropiedades":
                    return await ExecBuscarPropiedades(args);
                case "RegistrarNuevoLead":
                    return await ExecRegistrarNuevoLead(args, customerPhone);
                case "SolicitarAsistenciaHumana":
                    return await ExecSolicitarAsistenciaHumana(args, customerPhone);
                default:
                    return "Error: Herramienta no encontrada.";
            }
        } catch (Exception ex) {
            _logger.LogError(ex, "Error ejecutando herramienta {ToolName}", toolCall.FunctionName);
            return "Error al ejecutar la acción.";
        }
    }

    private async Task<string> ExecBuscarPropiedades(JsonDocument args)
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

        // --- NIVEL 1: Búsqueda con todos los filtros ---
        var query = _context.Properties.Where(p => p.EstadoComercial == "Disponible");
        
        // Mapeo geográfico simple para Ambato y Baños
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
                p.UrlRemax, 
                p.Operacion 
            })
            .ToListAsync();
        if (results.Any()) 
        {
            await LogAiAction("BusquedaExitosa", args.RootElement.GetRawText(), "Sistema", results.Count.ToString());
            return JsonSerializer.Serialize(results);
        }

        // --- NIVEL 2: Ignorar presupuesto pero mantener Tipo y Ubicación ---
        if (maxBudget.HasValue && (!string.IsNullOrEmpty(type) || !string.IsNullOrEmpty(location)))
        {
            _logger.LogInformation("Nivel 1 fallido. Nivel 2: Ignorando presupuesto.");
            var query2 = _context.Properties.Where(p => p.EstadoComercial == "Disponible");
            if (!string.IsNullOrEmpty(type)) query2 = query2.Where(p => EF.Functions.ILike(p.TipoPropiedad, $"%{type}%"));
            if (!string.IsNullOrEmpty(location)) query2 = query2.Where(p => EF.Functions.ILike(p.Sector, $"%{location}%") || EF.Functions.ILike(p.Ciudad, $"%{location}%"));
            
            results = await query2.OrderBy(p => p.Precio).Take(3).Select(p => new { p.Id, p.Titulo, p.Precio, p.Sector, p.Ciudad, p.Direccion, p.Habitaciones, p.Banos, p.Estacionamientos, p.AniosAntiguedad, p.UrlRemax, p.Operacion }).ToListAsync();
            if (results.Any()) 
            {
                await LogAiAction("BusquedaFallbackPresupuesto", args.RootElement.GetRawText(), "Sistema", results.Count.ToString());
                return "{\"Aviso\": \"No encontré opciones bajo ese presupuesto exacto, pero estas son las más económicas que cumplen con el tipo/ubicación:\", \"Resultados\": " + JsonSerializer.Serialize(results) + "}";
            }
        }

        // --- NIVEL 3: Mantener solo el TIPO (ignorar presupuesto y ubicación) ---
        if (!string.IsNullOrEmpty(type))
        {
            _logger.LogInformation("Nivel 2 fallido. Nivel 3: Solo manteniendo Tipo={Type}", type);
            results = await _context.Properties
                .Where(p => p.EstadoComercial == "Disponible" && EF.Functions.ILike(p.TipoPropiedad, $"%{type}%"))
                .OrderBy(p => p.Precio).Take(3)
                .Select(p => new { p.Id, p.Titulo, p.Precio, p.Sector, p.Ciudad, p.Direccion, p.Habitaciones, p.Banos, p.Estacionamientos, p.AniosAntiguedad, p.UrlRemax, p.Operacion })
                .ToListAsync();
            
            if (results.Any()) 
            {
                await LogAiAction("BusquedaFallbackTipo", args.RootElement.GetRawText(), "Sistema", results.Count.ToString());
                return "{\"Aviso\": \"No encontré " + type + "s en esa zona/presupuesto, pero aquí tienes las " + type + "s más baratas del catálogo:\", \"Resultados\": " + JsonSerializer.Serialize(results) + "}";
            }
        }

        // --- NIVEL 4: Fallback Total ---
        _logger.LogInformation("Niveles previos fallidos. Nivel 4: Fallback total del catálogo.");
        results = await _context.Properties
            .Where(p => p.EstadoComercial == "Disponible")
            .OrderBy(p => p.Precio).Take(3)
            .Select(p => new { p.Id, p.Titulo, p.Precio, p.Sector, p.Ciudad, p.Direccion, p.Habitaciones, p.Banos, p.Estacionamientos, p.AniosAntiguedad, p.UrlRemax, p.Operacion })
            .ToListAsync();

        if (results.Any()) 
        {
            await LogAiAction("BusquedaFallbackTotal", args.RootElement.GetRawText(), "Sistema", results.Count.ToString());
            return "{\"Aviso\": \"No encontré nada similar a tu búsqueda, pero estas son las ofertas más destacadas del momento:\", \"Resultados\": " + JsonSerializer.Serialize(results) + "}";
        }

        await LogAiAction("BusquedaSinResultados", args.RootElement.GetRawText(), "Sistema", "0");
        return "Lo siento, actualmente no tenemos ninguna propiedad disponible.";
    }

    private async Task<string> ExecRegistrarNuevoLead(JsonDocument args, string phone)
    {
        string nombre = args.RootElement.GetProperty("nombre").GetString() ?? "Desconocido";
        
        // Verificar si ya existe
        var existing = await _context.Leads.FirstOrDefaultAsync(l => l.Telefono == phone);
        if (existing != null) return "El cliente ya está registrado.";

        // Obtener un agente por defecto (el primero para este piloto)
        var agent = await _context.Agents.OrderBy(a => a.FechaCreacion).FirstOrDefaultAsync();
        if (agent == null) return "No hay agentes disponibles para asignar.";

        var lead = new Lead
        {
            Id = Guid.NewGuid(),
            Nombre = nombre,
            Telefono = phone,
            Origen = "WhatsApp",
            AgenteId = agent.Id,
            FechaCreacion = DateTimeOffset.UtcNow
        };

        _context.Leads.Add(lead);
        await LogAiAction("Registro Lead", args.RootElement.GetRawText(), phone);
        await _context.SaveChangesAsync();

        return "Cliente registrado correctamente.";
    }

    private async Task<string> ExecSolicitarAsistenciaHumana(JsonDocument args, string phone)
    {
        string motivo = args.RootElement.GetProperty("motivo").GetString() ?? "No especificado";

        await LogAiAction("Alerta", args.RootElement.GetRawText(), phone, motivo);
        await _context.SaveChangesAsync();

        return "Solicitud de asistencia enviada al equipo humano.";
    }

    private async Task LogAiAction(string accion, string detalle, string phone, string? nota = null)
    {
        var log = new AiActionLog
        {
            Id = Guid.NewGuid(),
            TelefonoCliente = phone,
            Accion = accion,
            DetalleJson = detalle,
            Fecha = DateTimeOffset.UtcNow
        };
        _context.AiActionLogs.Add(log);
    }

    private async Task SendWhatsAppMessageAsync(string to, string text)
    {
        if (string.IsNullOrEmpty(_whatsappToken) || string.IsNullOrEmpty(_whatsappPhoneId))
        {
            _logger.LogError("Faltan credenciales de WhatsApp (Token o PhoneID)");
            return;
        }

        var url = $"https://graph.facebook.com/v19.0/{_whatsappPhoneId}/messages";
        var payload = new
        {
            messaging_product = "whatsapp",
            to = to,
            type = "text",
            text = new { body = text }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _whatsappToken);
        request.Content = new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            _logger.LogError("Error enviando mensaje a WhatsApp: {Error}", error);
        }
    }

    private ChatCompletionOptions GetChatOptions()
    {
        var options = new ChatCompletionOptions
        {
            // --- CONTROL DE COSTOS (OUTPUT) ---
            // Ponemos un techo a la respuesta para evitar gastos inesperados.
            MaxOutputTokenCount = 500,
            
            // Penalizaciones para evitar respuestas repetitivas o redundantes.
            PresencePenalty = 0.6f,
            FrequencyPenalty = 0.5f
        };

        options.Tools.Add(ChatTool.CreateFunctionTool(
            "BuscarPropiedades",
            "Busca inmuebles disponibles. Es vital extraer el 'tipo' (Casa, Departamento, Terreno) si el cliente lo menciona.",
            BinaryData.FromBytes("""
            {
                "type": "object",
                "properties": {
                    "presupuestoMinimo": { "type": "number", "description": "Mínimo de precio." },
                    "presupuestoMaximo": { "type": "number", "description": "Límite de precio." },
                    "tipo": { "type": "string", "description": "Obligatorio si se menciona. Ej: 'Casa', 'Departamento', 'Terreno', 'Local', 'Oficina'." },
                    "ubicacion": { "type": "string", "description": "Sector o ciudad de interés." },
                    "keyword": { "type": "string", "description": "Palabra clave técnica extraída de la solicitud (ej: 'cisterna', 'piscina', 'jardín', 'ascensor')." },
                    "habitaciones": { "type": "integer", "description": "Número mínimo de habitaciones requeridas." },
                    "operacion": { "type": "string", "description": "Tipo de operación: 'Venta' o 'Alquiler'." }
                }
            }
            """u8.ToArray())
        ));

        options.Tools.Add(ChatTool.CreateFunctionTool(
            "RegistrarNuevoLead",
            "Crea un nuevo prospecto en el CRM.",
            BinaryData.FromBytes("""
            {
                "type": "object",
                "properties": {
                    "nombre": { "type": "string", "description": "Nombre completo del cliente." }
                },
                "required": ["nombre"]
            }
            """u8.ToArray())
        ));

        options.Tools.Add(ChatTool.CreateFunctionTool(
            "SolicitarAsistenciaHumana",
            "Pide ayuda a un humano solo si el bot falla tras buscar o si el cliente lo pide.",
            BinaryData.FromBytes("""
            {
                "type": "object",
                "properties": {
                    "motivo": { "type": "string", "description": "Razón del escalamiento." }
                },
                "required": ["motivo"]
            }
            """u8.ToArray())
        ));

        return options;
    }

    private string SerializeHistory(List<ChatMessage> history)
    {
        var dto = history.Select(m => {
            var item = new ChatMessageDto 
            { 
                Role = m is SystemChatMessage ? "system" : 
                       m is UserChatMessage ? "user" : 
                       m is AssistantChatMessage ? "assistant" : 
                       m is ToolChatMessage ? "tool" : "unknown",
                Content = m.Content.Count > 0 ? m.Content[0].Text : ""
            };

            if (m is ToolChatMessage t)
            {
                item.ToolCallId = t.ToolCallId;
            }
            else if (m is AssistantChatMessage a && a.ToolCalls?.Count > 0)
            {
                item.ToolCalls = a.ToolCalls.Select(tc => new ToolCallDto 
                { 
                    Id = tc.Id, 
                    Name = tc.FunctionName, 
                    Arguments = tc.FunctionArguments.ToString() 
                }).ToList();
            }

            return item;
        }).ToList();
        
        return JsonSerializer.Serialize(dto);
    }

    private List<ChatMessage> DeserializeHistory(string json)
    {
        var dtos = JsonSerializer.Deserialize<List<ChatMessageDto>>(json) ?? new List<ChatMessageDto>();
        var history = new List<ChatMessage>();

        foreach (var dto in dtos)
        {
            switch (dto.Role)
            {
                case "system": 
                    break;
                case "user": 
                    history.Add(new UserChatMessage(dto.Content)); 
                    break;
                case "assistant": 
                    if (dto.ToolCalls?.Count > 0)
                    {
                        var toolCalls = dto.ToolCalls.Select(tc => 
                            ChatToolCall.CreateFunctionToolCall(tc.Id, tc.Name, BinaryData.FromString(tc.Arguments))
                        ).ToList();
                        history.Add(new AssistantChatMessage(toolCalls));
                    }
                    else
                    {
                        history.Add(new AssistantChatMessage(dto.Content));
                    }
                    break;
                case "tool": 
                    history.Add(new ToolChatMessage(dto.ToolCallId!, dto.Content)); 
                    break;
            }
        }

        history.Insert(0, new SystemChatMessage(GetSystemPrompt()));

        return history;
    }

    private string GetSystemPrompt() => 
        "Eres el asistente virtual experto de 'CRM Inmobiliario Profesional'. Tu misión es encontrar la propiedad ideal siendo riguroso con los deseos del cliente.\n\n" +
        "REGLAS DE ORO:\n" +
        "1. EXTRACCIÓN DE DATOS: Identifica Tipo, Presupuesto, Ubicación y Keywords. Si el cliente da un rango (ej: 100k a 140k), usa 'presupuestoMinimo' y 'presupuestoMaximo'.\n" +
        "2. FILTROS NEGATIVOS (CRÍTICO): Si el usuario dice que NO quiere algo (ej: 'no en La Carolina', 'que no sea casa'), debes filtrar los resultados devueltos por la herramienta y ELIMINAR los que coincidan con la exclusión antes de responder. NUNCA muestres lo que el usuario rechazó.\n" +
        "3. CONTINUIDAD: Mantén el contexto de la búsqueda anterior (tipo, ubicación, presupuesto) si el usuario pide ajustes (ej: '¿y algo más barato?') a menos que cambie de tema.\n" +
        "4. FORMATO WHATSAPP: Usa SOLO un asterisco para negritas: *texto*. Prohibido usar (**).\n" +
        "5. PRESENTACIÓN: Por cada propiedad: *Título* - Precio - Ubicación (Sector). Menciona detalles técnicos si el usuario los pidió (parqueaderos, cisterna, etc.).\n\n" +
        "ESTRATEGIA:\n" +
        "- Si el cliente muestra interés real o pide visita: Usa 'SolicitarAsistenciaHumana' inmediatamente.\n" +
        "- Si el sistema devuelve un 'Aviso' en la búsqueda, explícaselo amablemente pero solo muestra los resultados que NO hayan sido excluidos por el usuario.";

    private class ChatMessageDto
    {
        public string Role { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? ToolCallId { get; set; }
        public List<ToolCallDto>? ToolCalls { get; set; }
    }

    private class ToolCallDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Arguments { get; set; } = string.Empty;
    }
}
