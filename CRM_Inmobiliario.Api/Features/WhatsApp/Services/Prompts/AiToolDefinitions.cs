using System;
using System.Collections.Generic;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Prompts;

public static class AiToolDefinitions
{
    public static List<AiToolDefinition> GetTools(string channel = "WhatsApp")
    {
        var tools = new List<AiToolDefinition>
        {
            new AiToolDefinition
            {
                Name = "BuscarPropiedades",
                Description = "Busca inmuebles utilizando búsqueda semántica. Pasa la intención en 'query'. EXTRAE LOS PARÁMETROS EXCLUSIVAMENTE DEL ÚLTIMO MENSAJE DEL USUARIO, ignora valores de búsquedas anteriores en el historial. CRÍTICO: La base de datos siempre devuelve 3 propiedades. DEBES revisar TODOS los campos de cada propiedad (Habitaciones, Baños, Parqueaderos, DescripcionSanitizada, etc.). Si el cliente pidió una característica específica (ej. '4 parqueos', 'domótica') y la propiedad NO la cumple (ni en sus valores numéricos ni en su descripción), IGNÓRALA por completo y NO la menciones para no generar ruido. Interpreta los datos inteligentemente y muestra SOLO las que realmente hagan match.",
                ParametersSchema = """
                {
                    "type": "object",
                    "properties": {
                        "query": { "type": "string", "description": "Intención de búsqueda en lenguaje natural. Ej: 'departamento minimalista', 'cerca de la playa'." },
                        "tipoOperacion": { "type": "string", "description": "Extraer SOLAMENTE si el cliente especifica la intención explícitamente en su ÚLTIMO mensaje (ej. 'Alquiler', 'Venta'). No adivinar ni reutilizar del historial." },
                        "presupuestoMaximo": { "type": "number", "description": "Extraer SOLAMENTE si el cliente menciona explícitamente un presupuesto o precio máximo en su ÚLTIMO mensaje. No adivinar ni reutilizar del historial." },
                        "habitacionesMinimas": { "type": "integer", "description": "Extraer SOLAMENTE si el cliente especifica un mínimo de habitaciones o cuartos en su ÚLTIMO mensaje. No adivinar ni reutilizar del historial." },
                        "antiguedadMaxima": { "type": "integer", "description": "Extraer SOLAMENTE si el cliente especifica años máximos de antigüedad en su ÚLTIMO mensaje (ej. 'nuevo' = 1, 'max 5 años' = 5). No adivinar ni reutilizar del historial." }
                    },
                    "required": ["query"]
                }
                """
            },
            new AiToolDefinition
            {
                Name = "ConsultarDetallesPropiedad",
                Description = "Consulta todos los detalles profundos (antigüedad, parqueos, dirección exacta, descripción larga) de una propiedad específica. Usa esta herramienta OBLIGATORIAMENTE cuando el cliente pregunte detalles sobre una propiedad de la que ya están hablando, ANTES de decirle que no tienes esa información.",
                ParametersSchema = """
                {
                    "type": "object",
                    "properties": {
                        "propiedadId": { "type": "string", "description": "El ID (Guid) de la propiedad que deseas consultar." }
                    },
                    "required": ["propiedadId"]
                }
                """
            },
            new AiToolDefinition
            {
                Name = "ConsultarBaseConocimiento",
                Description = channel == "Copilot" 
                    ? "Consulta los documentos y políticas corporativas de la inmobiliaria, tanto PÚBLICAS como INTERNAS (uso exclusivo para agentes). Usa esta herramienta cuando necesites entender procesos, comisiones, o políticas internas."
                    : "Consulta los documentos y políticas corporativas PÚBLICAS de la inmobiliaria (ej. reglas de reserva, devoluciones, requisitos de crédito). Usa esta herramienta cuando el cliente pregunte sobre cómo funcionan los procesos.",
                ParametersSchema = """
                {
                    "type": "object",
                    "properties": {
                        "query": { "type": "string", "description": "Pregunta corporativa o de proceso en lenguaje natural." }
                    },
                    "required": ["query"]
                }
                """
            },

            new AiToolDefinition
            {
                Name = "RegistrarInteresContacto",
                Description = "Registra el interés del cliente. REGLAS: 'Alto' (Quiere visitar o comprar), 'Medio' (Preguntas técnicas: alícuota, financiamiento, fotos detalladas), 'Bajo' (Preguntas básicas: precio, negociabilidad, ubicación general), 'Descartada' (Rechazo).",
                ParametersSchema = """
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
                """
            },


        };

        if (channel == "WhatsApp")
        {
            tools.Add(new AiToolDefinition
            {
                Name = "DerivarCaptacionPropietario",
                Description = "ÚSALA ÚNICAMENTE si el cliente indica que es DUEÑO de una propiedad y quiere venderla, alquilarla o promocionarla con nosotros. Esto terminará la conversación y derivará a un agente captador.",
                ParametersSchema = """
                {
                    "type": "object",
                    "properties": {
                        "nombre": { "type": "string", "description": "Nombre completo del propietario." }
                    },
                    "required": ["nombre"]
                }
                """
            });

            tools.Add(new AiToolDefinition
            {
                Name = "SolicitarAsistenciaHumana",
                Description = "Pide ayuda a un humano de forma OBLIGATORIA si detectas frustración, sarcasmo negativo, quejas repetitivas, lenguaje ofensivo, o si el cliente lo pide explícitamente.",
                ParametersSchema = """
                {
                    "type": "object",
                    "properties": {
                        "motivo": { "type": "string", "description": "Razón del escalamiento." }
                    },
                    "required": ["motivo"]
                }
                """
            });
        }
        else if (channel == "Copilot")
        {
            tools.Add(new AiToolDefinition
            {
                Name = "ResumirHistorialContacto",
                Description = "Consulta el historial completo de un contacto en el CRM (notas, tareas, etapa de embudo y mensajes previos). Úsala cuando necesites recordar el contexto completo de un cliente o antes de transferirlo a un agente.",
                ParametersSchema = """
                {
                    "type": "object",
                    "properties": {
                        "searchTerm": { "type": "string", "description": "Nombre completo o teléfono del contacto a buscar." }
                    },
                    "required": ["searchTerm"]
                }
                """
            });

            tools.Add(new AiToolDefinition
            {
                Name = "GenerarCotizacionRapida",
                Description = "Calcula la proyección hipotecaria y cuotas estimadas para la compra de una propiedad usando las tasas de interés y plazos actuales del mercado. NO inventes las cuotas, USA SIEMPRE esta herramienta para darle proyecciones precisas al cliente.",
                ParametersSchema = """
                {
                    "type": "object",
                    "properties": {
                        "montoPropiedad": { "type": "number", "description": "El precio total de la propiedad." },
                        "enganche": { "type": "number", "description": "El monto que el cliente planea dar como entrada o enganche inicial." }
                    },
                    "required": ["montoPropiedad", "enganche"]
                }
                """
            });

            tools.Add(new AiToolDefinition
            {
                Name = "CrearTareaCRM",
                Description = "Crea una tarea, recordatorio o cita en la agenda del agente en el CRM. Si el cliente pide agendar algo, DEBES pedir obligatoriamente Título, Descripción y Fecha/Hora. Si el cliente no te da alguno, PREGÚNTALE antes de usar esta herramienta.",
                ParametersSchema = """
                {
                    "type": "object",
                    "properties": {
                        "titulo": { "type": "string", "description": "Título corto y claro de la tarea." },
                        "descripcion": { "type": "string", "description": "Detalle completo de lo que el agente debe hacer o preparar." },
                        "fechaProgramada": { "type": "string", "description": "Fecha y hora en formato ISO 8601 (ej. 2024-05-20T15:30:00). Asegúrate de pedir la hora si el cliente solo dice el día." },
                        "contactoId": { "type": "string", "description": "ID del contacto (Guid), si lo conoces." },
                        "propiedadId": { "type": "string", "description": "ID de la propiedad (Guid), si aplica." }
                    },
                    "required": ["titulo", "descripcion", "fechaProgramada"]
                }
                """
            });

            tools.Add(new AiToolDefinition
            {
                Name = "NavegacionDirecta",
                Description = "Úsala OBLIGATORIAMENTE para redirigir al usuario a una sección específica del sistema (por ejemplo, agendar una cita o ver la vista 3D) en la SPA. Emite una señal de control de redirección.",
                ParametersSchema = """
                {
                    "type": "object",
                    "properties": {
                        "destino": { "type": "string", "description": "La ruta a la que se debe redirigir al usuario, ej. '/agendar-cita', '/propiedades/123/3d'." }
                    },
                    "required": ["destino"]
                }
                """
            });
        }

        return tools;
    }
}
