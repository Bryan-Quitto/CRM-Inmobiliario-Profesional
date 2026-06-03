using System;
using System.Collections.Generic;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Prompts;

public static class AiToolDefinitions
{
    public static List<AiToolDefinition> GetTools()
    {
        return new List<AiToolDefinition>
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
                Description = "Consulta los documentos y políticas corporativas de la inmobiliaria (ej. reglas de reserva, devoluciones, requisitos de crédito, comisiones). Usa esta herramienta cuando el cliente pregunte sobre cómo funcionan los procesos.",
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
            new AiToolDefinition
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
            },
            new AiToolDefinition
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
            }
        };
    }
}
