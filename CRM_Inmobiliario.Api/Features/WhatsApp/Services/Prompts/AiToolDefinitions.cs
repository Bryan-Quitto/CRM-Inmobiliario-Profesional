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
                        "query": { "type": "string", "description": "REGLA DE ORO: NO RESUMAS EL TEXTO. Copia y pega literalmente la frase o pregunta completa que el usuario te acaba de enviar. Debe contener todas sus palabras." },
                        "tipoOperacion": { "type": "string", "description": "Extraer SOLAMENTE si el cliente especifica la intención explícitamente en su ÚLTIMO mensaje (ej. 'Alquiler', 'Venta'). No adivinar ni reutilizar del historial." },
                        "presupuestoMaximo": { "type": "number", "description": "Extraer SOLAMENTE si el cliente menciona explícitamente un presupuesto o precio máximo en su ÚLTIMO mensaje. No adivinar ni reutilizar del historial." },
                        "habitacionesMinimas": { "type": "integer", "description": "Extraer SOLAMENTE si el cliente especifica un mínimo de habitaciones o cuartos en su ÚLTIMO mensaje. No adivinar ni reutilizar del historial." },
                        "antiguedadMaxima": { "type": "integer", "description": "Extraer SOLAMENTE si el cliente especifica años máximos de antigüedad en su ÚLTIMO mensaje (ej. 'nuevo' = 1, 'max 5 años' = 5). No adivinar ni reutilizar del historial." },
                        "ciudad": { "type": "string", "description": "Extraer ÚNICAMENTE el nombre exacto de la ciudad (ej. 'Guayaquil', 'Cuenca'). NUNCA incluyas sectores o barrios aquí." },
                        "sector": { "type": "string", "description": "Extraer ÚNICAMENTE el nombre del barrio o sector (ej. 'Sur', 'Urdesa'). NUNCA incluyas el nombre de la ciudad aquí (incorrecto: 'Sur de Cuenca', correcto: 'Sur')." }
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
                        "nombrePropiedad": { "type": "string", "description": "El nombre completo de la propiedad (ej. Departamento Duplex Compañero)." }
                    },
                    "required": ["nombrePropiedad"]
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


        };

        if (channel == "WhatsApp" || channel == "Facebook")
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
                Description = "Pide ayuda a un humano de forma OBLIGATORIA si hay una Negociación de precio, o si detectas frustración, sarcasmo negativo, quejas repetitivas, lenguaje ofensivo, o si el cliente lo pide explícitamente.",
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

            tools.Add(new AiToolDefinition
            {
                Name = "RegistrarInteresContacto",
                Description = "Registra el interés del cliente. REGLAS: 'Alto' (Quiere visitar o comprar), 'Medio' (Preguntas técnicas: alícuota, financiamiento, fotos detalladas), 'Bajo' (Preguntas básicas: precio, negociabilidad, ubicación general), 'Descartada' (Rechazo).",
                ParametersSchema = """
                {
                    "type": "object",
                    "properties": {
                        "nombrePropiedad": { "type": "string", "description": "El nombre completo de la propiedad." },
                        "nivelInteres": { 
                            "type": "string", 
                            "enum": ["Bajo", "Medio", "Alto", "Descartada"],
                            "description": "Nivel de interés según las REGLAS técnicas." 
                        }
                    },
                    "required": ["nombrePropiedad", "nivelInteres"]
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
                        "enganche": { "type": "number", "description": "El monto que el cliente planea dar como entrada o enganche inicial." },
                        "tasaInteresAnual": { "type": "number", "description": "La tasa de interés anual que ofrece el banco (ej. 8.5)." },
                        "plazosMeses": { 
                            "type": "array", 
                            "items": { "type": "integer" },
                            "description": "Los plazos de financiamiento convertidos a meses (ej. 15 años = [180])." 
                        }
                    },
                    "required": ["montoPropiedad", "enganche", "tasaInteresAnual", "plazosMeses"]
                }
                """
            });

            tools.Add(new AiToolDefinition
            {
                Name = "CrearTareaCRM",
                Description = "Crea una tarea o cita en el CRM. REGLA CRÍTICA: Debes revisar todo el historial reciente; si el usuario mencionó con quién es la cita (contacto) o dónde/qué propiedad es, ESTÁS OBLIGADO a enviar esos nombres en 'contactoBusqueda' y 'propiedadBusqueda'. NUNCA crees la tarea en blanco si tienes ese contexto. Si te falta Título, Descripción, Fecha/Hora o Tipo de Tarea, PREGÚNTALE al usuario antes de llamar la herramienta.",
                ParametersSchema = """
                {
                    "type": "object",
                    "properties": {
                        "contexto_previo": { "type": "string", "description": "Antes de llenar los demás campos, resume brevemente quién es la persona de interés y cuál es la propiedad mencionada en TODO el historial de la conversación. Si no hay ninguno, pon 'Ninguno'." },
                        "titulo": { "type": "string", "description": "Título corto y claro de la tarea." },
                        "descripcion": { "type": "string", "description": "Detalle completo de lo que el agente debe hacer o preparar." },
                        "fechaProgramada": { "type": "string", "description": "Fecha y hora en formato ISO 8601 (ej. 2024-05-20T15:30:00). Asegúrate de pedir la hora si el cliente solo dice el día." },
                        "tipoTarea": { 
                            "type": "string", 
                            "enum": ["Llamada", "Visita", "Reunión", "Trámite"],
                            "description": "El tipo de la tarea. Si el usuario no lo especifica explícitamente o no se deduce claramente, PREGÚNTALE." 
                        },
                        "contactoId": { "type": "string", "description": "ID exacto del contacto (Guid), SOLO si lo tienes explícitamente confirmado." },
                        "contactoBusqueda": { "type": "string", "description": "Nombre, apellido o teléfono a buscar si NO tienes el ID exacto." },
                        "propiedadId": { "type": "string", "description": "ID exacto de la propiedad (Guid), SOLO si lo tienes explícitamente confirmado." },
                        "propiedadBusqueda": { "type": "string", "description": "Título o código de la propiedad a buscar si NO tienes el ID exacto." }
                    },
                    "required": ["contexto_previo", "titulo", "descripcion", "fechaProgramada", "tipoTarea"]
                }
                """
            });


        }

        return tools;
    }
}
