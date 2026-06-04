# 037 - Fase 1: Infraestructura Core IA y FinOps

## 1. Intent
Establecer la infraestructura base para soportar funcionalidades de IA enfocadas en el Agente Inmobiliario (Copilot/Agent persona), separándola de la atención automática al cliente final (WhatsApp). Esto incluye la creación de servicios dedicados, la extracción de la lógica de enrutamiento semántico, control de costos (FinOps) directos por agente, y la generalización de la infraestructura de ejecución de herramientas (Tools).

## 2. Architecture
- **Vertical Slice Architecture**: Los nuevos componentes enfocados en el Copilot del Agente se organizarán en `/Features/AgentAi/` o `/Features/CoreAi/`.
- **Patrón "One Trip"**: Cualquier endpoint creado deberá adherirse a la prohibición estricta de múltiples `await` secuenciales en base de datos.
- **Componentes Clave**:
  - `AgentAiService`: Orquestador principal de la interacción IA para el Agente (Copilot).
  - `SemanticRouterService`: Refactorización y extracción del enrutamiento semántico actualmente anidado dentro de `WhatsAppAiService`.
  - `CoreAiToolExecutor`: Abstracción de la ejecución de Tools para soportar indistintamente contextos de "Contacto" (WhatsApp) y "Agente" (Copilot).
  - `AgentSystemPromptFactory`: Responsable de inyectar el contexto de asistente interno.

## 3. Database Changes
**Nueva Entidad: `AgentDailyTokenUsage`**
- Propósito: Rastrear el uso diario de IA (Tokens y USD) para el Agente que usa el Copilot, garantizando FinOps resilientes.
- Propiedades:
  - `Id` (Guid, PK)
  - `AgentId` (Guid, FK -> Agent)
  - `Date` (DateTimeOffset, truncado a medianoche UTC-5)
  - `TokensUsed`, `InputTokens`, `CachedTokens`, `OutputTokens` (int)
  - `CostoUSD`, `AhorroUSD` (decimal(18, 6))
- **Migrations**: Agregar `DbSet<AgentDailyTokenUsage>` en `CrmDbContext`.
- **Write-Time Calculation**: Implementar guardado robusto mediante retry loop atrapando `DbUpdateException` para concurrencia optimista, reutilizando la lógica probada en WhatsApp.

## 4. File-by-File Changes

### `CRM_Inmobiliario.Api/Domain/Entities/AgentDailyTokenUsage.cs` (Nuevo)
- Crear la entidad mapeada a la tabla para trackear los tokens diarios del Agente.

### `CRM_Inmobiliario.Api/Infrastructure/Persistence/CrmDbContext.cs` (Modificación)
- Añadir el `DbSet<AgentDailyTokenUsage>`.

### `CRM_Inmobiliario.Api/Features/CoreAi/Services/ISemanticRouterService.cs` y `SemanticRouterService.cs` (Nuevo)
- Encapsular la lógica que detecta `ChatIntent` (`NUEVA_BUSQUEDA`, `CAMBIO_TEMA`, `CONTINUACION`).
- Mover el prompt de enrutamiento semántico (`"Evalúa la intención de la última interacción..."`) de `WhatsAppAiService` a esta clase.

### `CRM_Inmobiliario.Api/Features/WhatsApp/WhatsAppAiService.cs` (Modificación)
- Remover la inicialización manual del router semántico y reemplazarla por inyección de `ISemanticRouterService`.

### `CRM_Inmobiliario.Api/Features/CoreAi/Services/ICoreAiToolExecutor.cs` (Refactor / Renombre de `IWhatsAppToolExecutor.cs`)
- Extraer `customerPhone`, `triggerMessage`, y `Contacto` de la firma y sustituirlos por un `ToolExecutionContext` que contenga metadatos agnósticos (`UserId`, `Channel`, etc.).
- Modificar los Handlers existentes para adaptarse a la nueva firma.

### `CRM_Inmobiliario.Api/Features/AgentAi/Services/AgentAiService.cs` (Nuevo)
- Servicio que consume `LLMProviderFactory` para instanciar el LLM (Gemini/OpenAI) usando el API Key del Agente o del Tenant.
- Incluir la lógica de captura de `Polly.Timeout.TimeoutRejectedException` y registro en log.
- Incluir el guardado del consumo en la tabla `AgentDailyTokenUsage` post-generación.

### `CRM_Inmobiliario.Api/Features/AgentAi/Services/AgentSystemPromptFactory.cs` (Nuevo)
- Devolver el `SystemPrompt` para el contexto "Agente": ej. *"Eres un asistente experto para agentes inmobiliarios. Tu objetivo es resumir datos, redactar correos, y ayudar en la gestión interna. No eres un bot de atención al cliente."*
