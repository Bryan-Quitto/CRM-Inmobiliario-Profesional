# Plan de Refactorización Modular: WhatsAppAiService.cs

## Objetivo
Modularizar `WhatsAppAiService.cs` (actualmente ~608 líneas) para cumplir con el Punto 3 de las tareas pendientes de `a.txt`. El archivo actual viola el principio de responsabilidad única al manejar el flujo de mensajes, la construcción de prompts estáticos de IA y la ejecución de reglas de negocio complejas (herramientas). Se extraerá la lógica en dos servicios especializados inyectables, dejando al servicio principal como un orquestador limpio.

## Archivos Clave y Contexto
- **Orquestador Principal:** `CRM_Inmobiliario.Api/Features/WhatsApp/WhatsAppAiService.cs`
- **Registro DI:** `CRM_Inmobiliario.Api/Program.cs`
- **Ruta de Nuevos Archivos:** `CRM_Inmobiliario.Api/Features/WhatsApp/Services/`

## Estrategia de Implementación (Surgical)

### 1. Creación de Contratos e Interfaces
Crear la carpeta `Services` dentro de `Features/WhatsApp` y definir las interfaces:

**`IWhatsAppPromptBuilder.cs`**:
- `string GetSystemPrompt(bool leadExists, string? leadName = null)`
- `ChatCompletionOptions GetChatOptions()`
- `string SerializeHistory(List<ChatMessage> history)`
- `List<ChatMessage> DeserializeHistory(string json, bool leadExists, string? leadName)`

**`IWhatsAppToolExecutor.cs`**:
- `Task<string> HandleToolCallAsync(ChatToolCall toolCall, string customerPhone, string triggerMessage, Lead? currentLead)`

### 2. Implementación de Servicios

**`WhatsAppPromptBuilder.cs`**:
- Implementar `IWhatsAppPromptBuilder`.
- Mover las plantillas largas, definiciones de herramientas JSON (para `GetChatOptions`) y la lógica de serialización/deserialización de `ChatMessageDto`.

**`WhatsAppToolExecutor.cs`**:
- Implementar `IWhatsAppToolExecutor`.
- Inyectar `CrmDbContext` y `ILogger<WhatsAppToolExecutor>`.
- Mover los métodos: `HandleToolCallAsync`, `ExecRegistrarInteresProspecto`, `ExecBuscarPropiedades`, `ExecRegistrarNuevoLead`, `ExecSolicitarAsistenciaHumana` y `LogAiAction`.

### 3. Refactorización del Orquestador (`WhatsAppAiService.cs`)
- Inyectar `IWhatsAppPromptBuilder` e `IWhatsAppToolExecutor` en el constructor.
- Reemplazar las llamadas a los métodos internos por llamadas a los servicios inyectados.
- Mantener la lógica principal de:
  - Recepción del mensaje y búsqueda inicial en DB (Lead filtering/etapa).
  - Ciclo "while" de OpenAI (`CompleteChatAsync`).
  - Envío de la respuesta final por la API Graph de Meta (`SendWhatsAppMessageAsync`).

### 4. Actualización de Dependency Injection (`Program.cs`)
- Registrar los nuevos servicios:
  ```csharp
  builder.Services.AddScoped<IWhatsAppPromptBuilder, WhatsAppPromptBuilder>();
  builder.Services.AddScoped<IWhatsAppToolExecutor, WhatsAppToolExecutor>();
  ```

## Pruebas y Validación (Zero Wait & Vertical Slice Check)
- **Compilación:** Ejecutar `dotnet build` para asegurar la integridad de las referencias.
- **Inyección:** Verificar la resolución de dependencias en el arranque del API.
- **Mantener Comportamiento:** Asegurar que la lógica de ventana deslizante y el filtrado por etapa del lead funcionen correctamente.
