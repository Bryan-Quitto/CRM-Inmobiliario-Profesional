# Spec 030: Migración Multimodal de Audio (Dual-Provider Gemini/OpenAI)

## 1. Intent (Objetivo)
Migrar el procesamiento de audios de WhatsApp para explotar la multimodalidad nativa de Gemini (evitando la latencia de Whisper y el almacenamiento ineficiente de base64), manteniendo retrocompatibilidad perfecta para los tenants que operan bajo OpenAI (BYOK Dual-Provider).

## 2. Estrategia "Structured One-Trip"
- **Object Storage (Zero Base64)**: Los audios `.ogg` descargados desde WhatsApp se suben inmediatamente a Supabase Storage. Solo se persiste el `MediaUrl` en la Base de Datos para mantener la infraestructura escalable.
- **Un Solo Viaje (Gemini)**: Se inyecta la referencia o los bytes de audio nativo directamente en Gemini (1.5 Flash/Pro). Mediante la manipulación del `ResponseSchema` del System Prompt, se le instruye al LLM que analice el audio y responda en formato JSON estricto con:
  - `user_transcription`: La transcripción literal del audio.
  - `ai_reply`: La respuesta comercial del agente al mensaje.
- **Fallback de 2 Viajes (OpenAI)**: Como los modelos de texto de OpenAI requieren texto de entrada estricto en el estándar, se ejecuta explícitamente `OpenAI.Audio` (Whisper) para extraer el texto (viaje 1), y luego se hace el envío de texto normal (viaje 2).

## 3. Cambios Arquitectónicos (Vertical Slice & Abstracciones Core)

### Modelos y Persistencia
- **`Models/AiMessage.cs`**: Modificado para abandonar el campo de texto plano único en favor de una colección `List<AiMessagePart> Parts`. Esto soporta tipos mixtos (`Text` y `Audio`).
- **`Prompts/ChatSerializer.cs`**: Adaptado con lógica condicional para evitar la persistencia SQL de arreglos masivos de bytes, garantizando el guardado de la información esencial del historial.
- **`Models/AiResponseUpdate.cs`**: Añadida la propiedad `AudioTranscription` para que la capa de abstracción del LLM pueda devolver el texto interpretado al orquestador en el flujo reverso.

### Procesamiento de Larga Duración (Jobs)
- **`Services/WhatsAppJobProcessor.cs`**: Desacoplado por completo de `OpenAI`. Ahora sus responsabilidades son:
  1. Descargar la media (Twilio/WhatsApp Graph API).
  2. Subir asíncronamente a Supabase Storage Bucket.
  3. Enviar a `WhatsAppAiService` delegando el ruteo interno.

### Capa de Orquestación y Proveedores
- **`Services/WhatsAppAiService.cs`**: Introduce `ProcessIncomingAudioAsync` o envía una estructura de Audio part a `ProcessMessageInternalAsync`, delegando el procesamiento final a la abstracción de Providers.
- **`Providers/GeminiProvider.cs`**: Implementa la lógica `Structured One-Trip` identificando los `Parts` de audio y activando la salida JSON de forma programática.
- **`Providers/OpenAiProvider.cs`**: Contiene la lógica Whisper para garantizar el Dual-Provider sin impacto en el resto del CRM.
