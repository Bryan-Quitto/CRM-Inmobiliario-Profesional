# Prompt para Sesión 3: Multimodalidad de Audio y Eliminación de Dependencia Estricta de Whisper

**Contexto para la nueva sesión:**
Copia y pega el siguiente texto en una **nueva sesión** de chat para iniciar el ciclo SDD de la tercera y última tarea arquitectónica.

---

**Copia desde aquí:**

Hola Gemini, inicia tu contexto usando `mem_context` para el proyecto "CRM Inmobiliario Profesional" y lee detenidamente `SKILLS.md`. 

Una vez que estés en contexto, quiero que inicies un flujo SDD (Spec-Driven Development) para la siguiente tarea arquitectónica de alta complejidad:

**Objetivo:** Migrar el procesamiento de audios de WhatsApp para explotar la multimodalidad nativa de Gemini, manteniendo retrocompatibilidad para los tenants que sigan usando OpenAI (BYOK Dual-Provider).

**Contexto Técnico:**
1. Ya hemos migrado los vectores a un esquema paralelo (Sesión 1) y abstraído el orquestador principal con un `ILLMProvider` y `AiMessage` (Sesión 2).
2. Actualmente, en `WhatsAppJobProcessor.cs`, cuando llega un audio, se descarga y se envía explícitamente a `whisper-1` (OpenAI.Audio) para obtener la transcripción, y luego se envía el texto a `WhatsAppAiService.ProcessIncomingMessageAsync`.
3. **Problema/Oportunidad:** Gemini soporta audio de manera multimodal nativa (Gemini 2.5 Flash / Pro). Transcribir con un servicio y luego enviar el texto al LLM añade latencia y consume tokens dobles. 
4. Dado que somos Dual-Provider, el flujo de audio debe ser inteligente: si el tenant usa Gemini, deberíamos inyectar el audio directamente en el prompt (o usar el proveedor de Gemini para transcribir si preferimos mantener el log de texto de la transcripción). Si usa OpenAI, se puede seguir usando Whisper (o la API multimodal de GPT-4o si se prefiere actualizar).

**Instrucciones SDD:**
1. Inicia con `/sdd-explore` para investigar `WhatsAppJobProcessor.cs`, la interfaz `ILLMProvider` y `WhatsAppAiService.cs`. 
2. Evalúa la mejor estrategia arquitectónica: ¿Extendemos `ILLMProvider` con un método `TranscribeAudioAsync(Stream)` para que cada proveedor lo maneje a su manera? ¿O modificamos `AiMessage` para soportar `Parts` multimedia (Audio) y que el LLM lo procese en un solo viaje (The One Trip Pattern)?
3. Genera la propuesta técnica y el diseño (`/sdd-propose` y `/sdd-design`).
4. Detente y pídeme aprobación antes de pasar a la fase de tareas (`/sdd-tasks`). ¡Asegúrate de respetar las reglas Inquebrantables y de no romper el historial de chat (el audio transcrito o procesado debe registrarse lógicamente para el historial)!

**Fin del copiado.**
