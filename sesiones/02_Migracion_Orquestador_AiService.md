# Prompt para Sesión 2: Refactorización del Orquestador IA y Function Calling

**Contexto para la nueva sesión:**
Copia y pega el siguiente texto en una **nueva sesión** de chat para iniciar el ciclo SDD de la segunda tarea arquitectónica.

---

**Copia desde aquí:**

Hola Gemini, inicia tu contexto usando `mem_context` para el proyecto "CRM Inmobiliario Profesional" y lee detenidamente `SKILLS.md`. 

Una vez que estés en contexto, quiero que inicies un flujo SDD (Spec-Driven Development) para la siguiente tarea arquitectónica de alta complejidad:

**Objetivo:** Migrar y refactorizar el orquestador principal (`WhatsAppAiService.cs`) y el sistema de llamadas a funciones (Function Calling) para soportar Gemini (Google.GenAI) en un entorno Dual-Provider BYOK.

**Contexto Técnico:**
1. En la sesión anterior ya resolvimos la base de datos (añadiendo columnas paralelas para vectores de 768 dimensiones).
2. Actualmente, `WhatsAppAiService.cs` depende de `OpenAI.ChatClient` y usa objetos específicos de OpenAI (`ChatFinishReason.ToolCalls`, `AssistantChatMessage`, `ToolChatMessage`).
3. También tenemos abstracciones como `IWhatsAppPromptBuilder` y `IWhatsAppToolExecutor`, además de definiciones de herramientas (`AiToolDefinitions.cs`).
4. El paquete `Google.GenAI` (v1.8.0) ya está instalado en el `.csproj`.
5. **Problema Crítico:** La API de Google.GenAI tiene una sintaxis distinta para el historial de chat (`Content`, `Part`) y para invocar/responder a llamadas a funciones (`GenerateContentAsync` con `Tools` y `FunctionDeclarations`). Necesitamos abstraer o bifurcar limpiamente esta lógica para que el tenant pueda usar `gpt-4o-mini` o `gemini-2.5-flash` según su configuración, sin romper el flujo conversacional de WhatsApp ni las herramientas RAG.

**Instrucciones SDD:**
1. Inicia con `/sdd-explore` para investigar `WhatsAppAiService.cs`, `IWhatsAppToolExecutor.cs`, `AiToolDefinitions.cs` y el `ChatSerializer.cs`.
2. Evalúa cómo implementar la abstracción (ej. un patrón Factory o un `ILLMProvider`) que inyecte el cliente correcto en el servicio, y cómo mapear las definiciones de funciones (Function Calling) al formato de Google.GenAI.
3. Genera la propuesta técnica y el diseño (`/sdd-propose` y `/sdd-design`).
4. Detente y pídeme aprobación antes de pasar a la fase de tareas (`/sdd-tasks`). ¡Asegúrate de respetar las reglas de arquitectura y no inflar innecesariamente el código, manteniendo cada clase enfocada!

**Fin del copiado.**
