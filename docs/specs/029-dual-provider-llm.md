# SDD 029: Refactorización Dual-Provider LLM (OpenAI y Gemini)

## 1. Objetivo
Migrar el orquestador principal (`WhatsAppAiService.cs`) y el sistema de llamadas a funciones (Function Calling) a un entorno Dual-Provider BYOK (Bring Your Own Key). Esto permite utilizar de forma agnóstica tanto `OpenAI.ChatClient` como `Google.GenAI`, aislando la lógica del SDK en una capa de infraestructura.

## 2. Decisiones Arquitectónicas

### 2.1 Modelos Agnósticos (Core Abstraction)
Se reemplazaron los tipos fuertemente acoplados del SDK de OpenAI que se filtraban en la capa de servicios (`WhatsAppAiService`, `ChatSerializer`, `IWhatsAppToolExecutor`) por modelos genéricos del dominio:
- `AiMessage`: Representación agnóstica de los mensajes del chat (System, User, Assistant, Tool).
- `AiToolCall`: Representación de una solicitud de ejecución de herramienta.
- `AiToolDefinition`: Encapsula el nombre, descripción y el string JSON Schema crudo de cada herramienta.
- `AiResponseUpdate`: Soporte explícito para Streaming de texto y llamadas a herramientas en chunks.

### 2.2 Patrón de Inyección Zero-Config (BYOK)
Se ha evitado depender de configuraciones explícitas en la base de datos (e.g., Enum de Proveedores). En su lugar, el `LLMProviderFactory` intercepta el token JWT/API Key proporcionado y decide dinámicamente qué proveedor instanciar:
- Si el token comienza por `AIza`: Se instancia `GeminiProvider`.
- En caso contrario: Se asume (fallback a) `OpenAiProvider` (típicamente `sk-proj-`).

### 2.3 Streaming Nativo (Zero-Wait Policy)
Para cumplir con los estándares World-Class del proyecto, la interfaz unificada `ILLMProvider` no expone tareas bloqueantes `Task<AiResponse>`, sino que expone directamente un flujo asíncrono:
```csharp
IAsyncEnumerable<AiResponseUpdate> StreamChatAsync(List<AiMessage> history, List<AiToolDefinition> tools, string apiKey)
```
Esto permite enviar los tokens directamente al Webhook o SignalR conforme se van generando, reduciendo la latencia percibida a cero.

### 2.4 Conversión Mágica de JSON Schema (Gemini)
El sistema actual definía las herramientas utilizando objetos JSON Schema nativos inyectados como strings crudos en `AiToolDefinitions.cs`. Dado que el SDK de `Google.GenAI` (`Google.GenAI.Types.Schema`) requiere la construcción de objetos fuertemente tipados para su `FunctionDeclaration`:
- El `GeminiProvider` incluye un parser que lee recursivamente el JSON Schema utilizando `JsonDocument`.
- Transforma dinámicamente los campos de tipo, descripciones, objetos y arrays de JSON puro hacia instancias del SDK de Google en tiempo de ejecución.

## 3. Componentes Modificados/Creados

**Nuevos:**
- `Features/WhatsApp/Services/Models/AiMessage.cs`
- `Features/WhatsApp/Services/Models/AiToolCall.cs`
- `Features/WhatsApp/Services/Models/AiToolDefinition.cs`
- `Features/WhatsApp/Services/Models/AiResponseUpdate.cs`
- `Features/WhatsApp/Services/Providers/ILLMProvider.cs`
- `Features/WhatsApp/Services/Providers/OpenAiProvider.cs`
- `Features/WhatsApp/Services/Providers/GeminiProvider.cs`
- `Features/WhatsApp/Services/Providers/LLMProviderFactory.cs`

**Refactorizados:**
- `Features/WhatsApp/Services/Prompts/AiToolDefinitions.cs` (Retorna `AiToolDefinition` en lugar de `ChatTool`).
- `Features/WhatsApp/Services/Prompts/ChatSerializer.cs` (Usa `System.Text.Json` para de/serializar `AiMessage`).
- `Features/WhatsApp/Services/IWhatsAppToolExecutor.cs` (Acepta `AiToolCall`).
- `Features/WhatsApp/WhatsAppAiService.cs` (Consume la interfaz `ILLMProvider` de forma agnóstica).

## 4. Estado de Verificación
- **Integración:** Compilación exitosa (`dotnet build`). Serialización retroactiva con la base de datos validada.
- **Pendiente:** Verificación funcional manual en runtime enviando mensajes desde el cliente final a través de la integración de WhatsApp.
