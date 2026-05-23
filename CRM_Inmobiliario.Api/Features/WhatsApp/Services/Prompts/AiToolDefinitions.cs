using OpenAI.Chat;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Prompts;

public static class AiToolDefinitions
{
    public static void AddTools(ChatCompletionOptions options)
    {
        options.Tools.Add(ChatTool.CreateFunctionTool(
            "BuscarPropiedades",
            "Busca inmuebles disponibles utilizando búsqueda semántica avanzada. Pasa directamente la intención del cliente en 'query' (ej: 'casa de 3 cuartos con patio en cumbaya por 150000').",
            BinaryData.FromBytes("""
            {
                "type": "object",
                "properties": {
                    "query": { "type": "string", "description": "Intención de búsqueda en lenguaje natural." }
                },
                "required": ["query"]
            }
            """u8.ToArray())
        ));

        options.Tools.Add(ChatTool.CreateFunctionTool(
            "RegistrarNuevoContacto",
            "Crea un nuevo contacto en el CRM. Debes llamar a esta herramienta SIEMPRE ANTES de registrar un interés si el cliente no está en la base.",
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
            "RegistrarInteresContacto",
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
            "DerivarCaptacionPropietario",
            "ÚSALA ÚNICAMENTE si el cliente indica que es DUEÑO de una propiedad y quiere venderla, alquilarla o promocionarla con nosotros. Esto terminará la conversación y derivará a un agente captador.",
            BinaryData.FromBytes("""
            {
                "type": "object",
                "properties": {
                    "nombre": { "type": "string", "description": "Nombre completo del propietario." }
                },
                "required": ["nombre"]
            }
            """u8.ToArray())
        ));

        options.Tools.Add(ChatTool.CreateFunctionTool(
            "SolicitarAsistenciaHumana",
            "Pide ayuda a un humano de forma OBLIGATORIA si detectas frustración, sarcasmo negativo, quejas repetitivas, lenguaje ofensivo, o si el cliente lo pide explícitamente.",
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
    }
}
