using OpenAI.Chat;
using System.Text.Json;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public sealed class WhatsAppPromptBuilder : IWhatsAppPromptBuilder
{
    public string GetSystemPrompt(bool leadExists, string? leadName = null) => 
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

    public ChatCompletionOptions GetChatOptions()
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

    public string SerializeHistory(List<ChatMessage> history)
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

    public List<ChatMessage> DeserializeHistory(string json, bool leadExists, string? leadName)
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
