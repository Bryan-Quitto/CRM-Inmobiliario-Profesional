using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OpenAI.Chat;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Net.Http.Headers;
using System.Text.RegularExpressions;

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

            // 1. Obtener o crear conversación y buscar al Lead de forma inteligente
            var conversation = await _context.WhatsappConversations
                .FirstOrDefaultAsync(c => c.Telefono == phone);
            
            // Búsqueda inteligente: WhatsApp manda sin +, la DB puede tener +
            string searchPhone = phone.StartsWith("+") ? phone : "+" + phone;
            var lead = await _context.Leads.AsNoTracking()
                .FirstOrDefaultAsync(l => l.Telefono == phone || l.Telefono == searchPhone);
            
            var leadExists = lead != null;

            List<ChatMessage> history;
            if (conversation == null)
            {
                history = new List<ChatMessage> { new SystemChatMessage(GetSystemPrompt(leadExists, lead?.Nombre)) };
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
                history = DeserializeHistory(conversation.HistorialJson, leadExists, lead?.Nombre);
            }

            // 2. Añadir mensaje del usuario a la historia y a la base de datos
            history.Add(new UserChatMessage(messageText));
            
            _context.WhatsappMessages.Add(new WhatsappMessage 
            { 
                Id = Guid.NewGuid(),
                Telefono = phone, 
                Rol = "user", 
                Contenido = messageText, 
                Fecha = DateTimeOffset.UtcNow 
            });

            // --- CONTROL DE COSTOS (INPUT): Ventana deslizante de historial ---
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
                _logger.LogInformation("--- ENVIANDO A OPENAI (Historia acumulada: {Count} mensajes) ---", history.Count);
                
                ChatCompletion completion = await chatClient.CompleteChatAsync(history, options);
                requiresAction = false;

                _logger.LogInformation("--- CONSUMO DE TOKENS: Input={Input}, Output={Output}, Total={Total} ---", 
                    completion.Usage.InputTokenCount, completion.Usage.OutputTokenCount, completion.Usage.TotalTokenCount);

                switch (completion.FinishReason)
                {
                    case ChatFinishReason.Stop:
                        finalResponse = completion.Content[0].Text;
                        history.Add(new AssistantChatMessage(completion));
                        
                        _context.WhatsappMessages.Add(new WhatsappMessage 
                        { 
                            Id = Guid.NewGuid(),
                            Telefono = phone, 
                            Rol = "assistant", 
                            Contenido = finalResponse, 
                            Fecha = DateTimeOffset.UtcNow 
                        });

                        _logger.LogInformation("--- RESPUESTA FINAL IA: {Response} ---", finalResponse);
                        break;

                    case ChatFinishReason.ToolCalls:
                        history.Add(new AssistantChatMessage(completion.ToolCalls));
                        foreach (var toolCall in completion.ToolCalls)
                        {
                            _logger.LogInformation("--- IA DECIDIÓ LLAMAR A: {Tool} con ARGS: {Args} ---", toolCall.FunctionName, toolCall.FunctionArguments);
                            string toolResult = await HandleToolCallAsync(toolCall, phone, messageText, lead);
                            _logger.LogInformation("--- RESULTADO DE LA HERRAMIENTA: {Result} ---", toolResult);
                            history.Add(new ToolChatMessage(toolCall.Id, toolResult));
                        }
                        requiresAction = true;
                        break;
                }
            }

            // 4. Guardar historial y mensajes actualizados
            conversation.HistorialJson = SerializeHistory(history);
            conversation.UltimaActualizacion = DateTimeOffset.UtcNow;
            
            _logger.LogInformation("Guardando cambios en DB para {Phone}...", phone);
            await _context.SaveChangesAsync();
            _logger.LogInformation("DB actualizada correctamente para {Phone}.", phone);

            // 5. Enviar respuesta a WhatsApp
            if (!string.IsNullOrEmpty(finalResponse))
            {
                // Limpieza agresiva: Convertir cualquier secuencia de asteriscos (**, ***, etc) en uno solo.
                finalResponse = Regex.Replace(finalResponse, @"\*+", "*");
                
                await SendWhatsAppMessageAsync(phone, finalResponse);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error crítico procesando mensaje de WhatsApp para {Phone}", phone);
        }
    }

    private async Task<string> HandleToolCallAsync(ChatToolCall toolCall, string customerPhone, string triggerMessage, Lead? currentLead)
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

        var query = _context.Properties
            .Where(p => p.EstadoComercial == "Disponible")
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
                p.TipoPropiedad
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
            var query2 = _context.Properties.Where(p => p.EstadoComercial == "Disponible");
            if (!string.IsNullOrEmpty(type)) query2 = query2.Where(p => EF.Functions.ILike(p.TipoPropiedad, $"%{type}%"));
            if (!string.IsNullOrEmpty(location)) query2 = query2.Where(p => EF.Functions.ILike(p.Sector, $"%{location}%") || EF.Functions.ILike(p.Ciudad, $"%{location}%"));
            
            results = await query2.OrderBy(p => p.Precio).Take(3).Select(p => new { p.Id, p.Titulo, p.Precio, p.Sector, p.Ciudad, p.Direccion, p.Habitaciones, p.Banos, p.Estacionamientos, p.AniosAntiguedad, p.AreaTotal, p.AreaConstruccion, p.AreaTerreno, p.MediosBanos, p.UrlRemax, p.Operacion, p.TipoPropiedad }).ToListAsync();
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
                .Where(p => p.EstadoComercial == "Disponible" && EF.Functions.ILike(p.TipoPropiedad, $"%{type}%"))
                .OrderBy(p => p.Precio).Take(3)
                .Select(p => new { p.Id, p.Titulo, p.Precio, p.Sector, p.Ciudad, p.Direccion, p.Habitaciones, p.Banos, p.Estacionamientos, p.AniosAntiguedad, p.AreaTotal, p.AreaConstruccion, p.AreaTerreno, p.MediosBanos, p.UrlRemax, p.Operacion, p.TipoPropiedad })
                .ToListAsync();
            
            if (results.Any()) 
            {
                await LogAiAction("BusquedaPropiedades", args.RootElement.GetRawText(), phone, triggerMessage, lead?.Id);
                return "{\"Aviso\": \"No encontré " + type + "s en esa zona/presupuesto, pero aquí tienes las " + type + "s más baratas del catálogo:\", \"Resultados\": " + JsonSerializer.Serialize(results) + "}";
            }
        }

        results = await _context.Properties
            .Where(p => p.EstadoComercial == "Disponible")
            .OrderBy(p => p.Precio).Take(3)
            .Select(p => new { p.Id, p.Titulo, p.Precio, p.Sector, p.Ciudad, p.Direccion, p.Habitaciones, p.Banos, p.Estacionamientos, p.AniosAntiguedad, p.AreaTotal, p.AreaConstruccion, p.AreaTerreno, p.MediosBanos, p.UrlRemax, p.Operacion, p.TipoPropiedad })
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

    private async Task SendWhatsAppMessageAsync(string to, string text)
    {
        if (string.IsNullOrEmpty(_whatsappToken) || string.IsNullOrEmpty(_whatsappPhoneId)) return;

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

        await _httpClient.SendAsync(request);
    }

    private ChatCompletionOptions GetChatOptions()
    {
        var options = new ChatCompletionOptions
        {
            MaxOutputTokenCount = 500,
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
            "Crea un nuevo prospecto en el CRM. Debes llamar a esta herramienta SIEMPRE ANTES de registrar un interés si el cliente no está en la base.",
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
            "RegistrarInteresProspecto",
            "Registra el interés del cliente. REGLAS: 'Alto' (Quiere visitar o comprar), 'Medio' (Preguntas técnicas: alícuota, financiamiento, fotos detalladas), 'Bajo' (Preguntas básicas: precio, negociabilidad, ubicación general), 'Descartada' (Rechazo).",
            BinaryData.FromBytes("""
            {
                "type": "object",
                "properties": {
                    "propiedadId": { "type": "string", "description": "ID único de la propiedad (Guid)." },
                    "nivelInteres": { 
                        "type": "string", 
                        "enum": ["Bajo", "Medio", "Alto", "Descartada"],
                        "description": "Nivel de interés según las REGLAS técnicas." 
                    }
                },
                "required": ["propiedadId", "nivelInteres"]
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

    private List<ChatMessage> DeserializeHistory(string json, bool leadExists, string? leadName)
    {
        var dtos = JsonSerializer.Deserialize<List<ChatMessageDto>>(json) ?? new List<ChatMessageDto>();
        var history = new List<ChatMessage>();

        foreach (var dto in dtos)
        {
            switch (dto.Role)
            {
                case "system": break;
                case "user": history.Add(new UserChatMessage(dto.Content)); break;
                case "assistant": 
                    if (dto.ToolCalls?.Count > 0)
                    {
                        var toolCalls = dto.ToolCalls.Select(tc => ChatToolCall.CreateFunctionToolCall(tc.Id, tc.Name, BinaryData.FromString(tc.Arguments))).ToList();
                        history.Add(new AssistantChatMessage(toolCalls));
                    }
                    else history.Add(new AssistantChatMessage(dto.Content));
                    break;
                case "tool": history.Add(new ToolChatMessage(dto.ToolCallId!, dto.Content)); break;
            }
        }
        history.Insert(0, new SystemChatMessage(GetSystemPrompt(leadExists, leadName)));
        return history;
    }

    private string GetSystemPrompt(bool leadExists, string? leadName = null) => 
        "Eres el asistente virtual de 'CRM Inmobiliario Profesional'. Tu misión es perfilar al cliente de forma invisible mientras conversas.\n\n" +
        (leadExists 
            ? $"ESTADO DEL CLIENTE: REGISTRADO como '{leadName ?? "Cliente"}'. Ya no necesitas pedir su nombre.\n\n" 
            : "ESTADO DEL CLIENTE: NO REGISTRADO. Debes obtener su nombre de forma amable y llamar a 'RegistrarNuevoLead' lo antes posible. No puedes registrar intereses sin antes registrar al cliente.\n\n") +
        "MANDATO DE ACCIÓN TÉCNICA (OBLIGATORIO):\n" +
        "Cada vez que el cliente pregunte o mencione algo sobre una propiedad específica, DEBES llamar a 'RegistrarInteresProspecto' ANTES de dar tu respuesta de texto.\n\n" +
        "REGLA DE PROTECCIÓN DE COMISIÓN (CRÍTICO):\n" +
        "1. NUNCA menciones 'la inmobiliaria', 'la agencia' ni pidas al cliente que llame a una oficina.\n" +
        "2. SIEMPRE di que 'en un momento un agente se pondrá en contacto con usted' o 'un asesor le escribirá pronto' para cualquier trámite, cita o información que tú no tengas.\n\n" +
        "MATRIZ DE CALIFICACIÓN (TRIGGER -> ACCIÓN):\n" +
        "- Pregunta por Precio, Disponibilidad, Negociabilidad o Ubicación -> Llama a 'RegistrarInteresProspecto' con nivel 'Bajo'.\n" +
        "- Pregunta por Alícuota, Años, Fotos extras, Financiamiento o detalles técnicos -> Llama a 'RegistrarInteresProspecto' con nivel 'Medio'.\n" +
        "- Pide Visita, Reunión o indica que la comprará/quiere reservar -> Llama a 'RegistrarInteresProspecto' con nivel 'Alto'.\n" +
        "- RECHAZO EXPLÍCITO Y DIRECTO: Solo si el cliente dice literalmente que NO le gusta una propiedad específica, que es fea, o pide quitarla de su vista -> Llama a 'RegistrarInteresProspecto' con nivel 'Descartada'.\n" +
        "- REGLA DE ORO (PREVENCIÓN DE ERRORES): NUNCA descartes propiedades por comentarios generales sobre el presupuesto (ej: 'muy caro', 'no me gusta ese precio'). No descartes una propiedad si el usuario está pidiendo verla o compararla.\n\n" +
        "PLANTILLAS DE RESPUESTA (OBLIGATORIAS):\n" +
        "Para CASAS 🏠:\n" +
        "TITULO\n" +
        "- 💰 *Precio:* $Valor\n" +
        "- 📍 *Ubicación:* Sector, Ciudad\n" +
        "- 📋 *Operación:* Venta/Alquiler\n" +
        "- 🛏️ *Habitaciones:* Cantidad\n" +
        "- 🚿 *Baños:* Cantidad (incluir medios baños si hay)\n" +
        "- 🚗 *Parqueos:* Cantidad\n" +
        "- 🏗️ *Construcción:* Área m²\n" +
        "- 📅 *Antigüedad:* Años\n" +
        "- [Ver más detalles aquí](UrlRemax)\n\n" +
        "Para DEPARTAMENTOS 🏢:\n" +
        "TITULO\n" +
        "- 💰 *Precio:* $Valor\n" +
        "- 📍 *Ubicación:* Sector, Ciudad\n" +
        "- 📋 *Operación:* Venta/Alquiler\n" +
        "- 🛏️ *Habitaciones:* Cantidad\n" +
        "- 🚿 *Baños:* Cantidad\n" +
        "- 🚗 *Parqueos:* Cantidad\n" +
        "- 📏 *Área:* Área m²\n" +
        "- 📅 *Antigüedad:* Años\n" +
        "- [Ver más detalles aquí](UrlRemax)\n\n" +
        "Para TERRENOS 🏗️:\n" +
        "TITULO\n" +
        "- 💰 *Precio:* $Valor\n" +
        "- 📍 *Ubicación:* Sector, Ciudad\n" +
        "- 📋 *Operación:* Venta/Alquiler\n" +
        "- 📐 *Área Terreno:* Área m²\n" +
        "- 📏 *Área Total:* Área m²\n" +
        "- [Ver más detalles aquí](UrlRemax)\n\n" +
        "Para LOCALES/OFICINAS 💼:\n" +
        "TITULO\n" +
        "- 💰 *Precio:* $Valor\n" +
        "- 📍 *Ubicación:* Sector, Ciudad\n" +
        "- 📋 *Operación:* Venta/Alquiler\n" +
        "- 🚿 *Baños:* Cantidad\n" +
        "- 🚗 *Parqueos:* Cantidad\n" +
        "- 📏 *Área:* Área m²\n" +
        "- [Ver más detalles aquí](UrlRemax)\n\n" +
        "PROTOCOLO DE CONVERSACIÓN:\n" +
        "1. RESPUESTA NATURAL Y AMIGABLE: Responde con calidez. NO menciones que has registrado nada.\n" +
        "2. NO PRESIONAR: Prohibido sugerir visitas o pedir datos en niveles 'Bajo' o 'Medio'. Solo hazlo en nivel 'Alto'.\n" +
        "3. BLOQUEO TÉCNICO: Si una propiedad es 'Descartada', el sistema la filtrará automáticamente.\n" +
        "4. FORMATO WHATSAPP (ESTRICTO):\n" +
        "   - NEGRITAS: Usa únicamente un solo asterisco (*texto*). NUNCA uses doble asterisco (**texto**).\n" +
        "   - EMOJIS: Usa exactamente los emojis de las plantillas de arriba.\n" +
        "   - TITULOS: Escribe el título de la propiedad en MAYÚSCULAS sin asteriscos.";

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
