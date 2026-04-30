using OpenAI.Chat;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Prompts;

public static class AiToolDefinitions
{
    public static void AddTools(ChatCompletionOptions options)
    {
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
    }
}
