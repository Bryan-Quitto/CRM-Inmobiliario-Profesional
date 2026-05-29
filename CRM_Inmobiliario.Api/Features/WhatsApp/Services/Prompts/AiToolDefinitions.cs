using OpenAI.Chat;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Prompts;

public static class AiToolDefinitions
{
    public static void AddTools(ChatCompletionOptions options)
    {
        options.Tools.Add(ChatTool.CreateFunctionTool(
            "BuscarPropiedades",
            "Busca inmuebles utilizando búsqueda semántica. Pasa la intención en 'query'. CRÍTICO: La base de datos siempre devuelve 3 propiedades. DEBES revisar TODOS los campos de cada propiedad (Habitaciones, Baños, Parqueaderos, DescripcionSanitizada, etc.). Si el cliente pidió una característica específica (ej. '4 parqueos', 'domótica') y la propiedad NO la cumple (ni en sus valores numéricos ni en su descripción), IGNÓRALA por completo y NO la menciones para no generar ruido. Interpreta los datos inteligentemente y muestra SOLO las que realmente hagan match.",
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
            "ConsultarDetallesPropiedad",
            "Consulta todos los detalles profundos (antigüedad, parqueos, dirección exacta, descripción larga) de una propiedad específica. Usa esta herramienta OBLIGATORIAMENTE cuando el cliente pregunte detalles sobre una propiedad de la que ya están hablando, ANTES de decirle que no tienes esa información.",
            BinaryData.FromBytes("""
            {
                "type": "object",
                "properties": {
                    "propiedadId": { "type": "string", "description": "El ID (Guid) de la propiedad que deseas consultar." }
                },
                "required": ["propiedadId"]
            }
            """u8.ToArray())
        ));

        options.Tools.Add(ChatTool.CreateFunctionTool(
            "ConsultarBaseConocimiento",
            "Consulta los documentos y políticas corporativas de la inmobiliaria (ej. reglas de reserva, devoluciones, requisitos de crédito, comisiones). Usa esta herramienta cuando el cliente pregunte sobre cómo funcionan los procesos.",
            BinaryData.FromBytes("""
            {
                "type": "object",
                "properties": {
                    "query": { "type": "string", "description": "Pregunta corporativa o de proceso en lenguaje natural." }
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
