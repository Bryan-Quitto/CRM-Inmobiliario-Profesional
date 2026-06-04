# Spec & Design: Fase 2 - Streaming, Historial y Autogeneración de Títulos

## Intent
Habilitar a los agentes inmobiliarios para que puedan interactuar con el Agente IA interno ("Copilot") desde el panel web de manera fluida y conversacional. Esto requiere la implementación de streaming (Server-Sent Events) para respuestas en tiempo real, persistencia del historial de la conversación, paginación del historial, autogeneración de títulos para las conversaciones, y la ampliación del RAG para consultar documentos tanto públicos como internos, diferenciando el canal de la solicitud.

## Architecture & Approach
Se respetará la **Vertical Slice Architecture** definida en el proyecto, utilizando Minimal APIs ("The One Trip Pattern") para la creación de endpoints, evitando múltiples sequential awaits siempre que sea posible.

1. **Modelos de Dominio**: Se agregarán nuevas entidades `AgentConversation` y `AgentMessage` para persistir el historial de las conversaciones de cada agente con la IA.
2. **Streaming (SSE)**: El endpoint `StreamChatEndpoint` utilizará Server-Sent Events. Emitirá a la respuesta HTTP usando `response.WriteAsync($"data: {chunk}\n\n")` a medida que `AgentAiService` consuma el `IAsyncEnumerable` del proveedor de LLM.
3. **Paginación del Historial**: Se crearán dos endpoints dedicados, `GetConversationsEndpoint` y `GetConversationMessagesEndpoint`, que realizarán consultas directas a EF Core con `.Skip()` y `.Take()`.
4. **Autogeneración de Títulos**: Se usará un enfoque fire-and-forget o Task Background para no bloquear el response del usuario. Al momento de guardar el primer mensaje, se llamará a un LLM pequeño (`gpt-4o-mini` o `gemini-2.5-flash-lite`) para generar un título corto y actualizar el registro de la conversación.
5. **RAG Público/Interno**: El `ToolExecutionContext` ya incluye la propiedad `Channel` ("Copilot" o "WhatsApp"). `ConsultarBaseConocimientoHandler` se modificará para que, si `Channel == "Copilot"`, permita buscar en documentos internos y públicos.

## DB Changes
1. **Entity `AgentConversation`**:
   - `Id` (Guid, PK)
   - `AgentId` (Guid, FK -> Agents)
   - `Title` (string, max 100, nullable)
   - `CreatedAt` (DateTimeOffset)
   - `UpdatedAt` (DateTimeOffset)

2. **Entity `AgentMessage`**:
   - `Id` (Guid, PK)
   - `AgentConversationId` (Guid, FK -> AgentConversations)
   - `Role` (string, max 20) ("user", "assistant")
   - `Content` (string)
   - `CreatedAt` (DateTimeOffset)

3. **Contexto de Base de Datos**: 
   - Agregar `DbSet<AgentConversation> AgentConversations` y `DbSet<AgentMessage> AgentMessages` a `CrmDbContext`.
   - Crear migraciones mediante CLI: `dotnet ef migrations add AddAgentConversations`.

## File-by-File Changes

### 1. `Domain/Entities/AgentConversation.cs`
- Crear entidad configurando Data Annotations (`[Required]`, `[MaxLength(100)]` para el Title) y navegación con `AgentMessage`.

### 2. `Domain/Entities/AgentMessage.cs`
- Crear entidad con Data Annotations para `Role` (`[MaxLength(20)]`) y la relación requerida con `AgentConversation`.

### 3. `Infrastructure/Persistence/CrmDbContext.cs`
- Agregar propiedades `DbSet` correspondientes.
- Configurar en `OnModelCreating` el comportamiento de borrado en cascada (Cascade Delete) entre Conversación y Mensajes.

### 4. `Features/AgentAi/Endpoints/StreamChatEndpoint.cs`
- **Ruta**: `POST /api/agent-ai/chat/stream`
- **Flujo**:
  1. Validar el input (`ConversationId` y `Message`). Si no hay `ConversationId`, crear una nueva `AgentConversation`.
  2. Guardar inmediatamente el `AgentMessage` del usuario en la base de datos.
  3. Establecer `Content-Type: text/event-stream`.
  4. Llamar a `AgentAiService.StreamResponseAsync`.
  5. Iterar sobre los chunks devueltos, escribiéndolos al stream.
  6. Al terminar la iteración, guardar el texto completo como un nuevo `AgentMessage` (rol `assistant`).
  7. Si era el primer mensaje de la conversación, despachar `Task.Run` o usar un servicio registrado en Hangfire para generar el título de la conversación.

### 5. `Features/AgentAi/Endpoints/GetConversationsEndpoint.cs`
- **Ruta**: `GET /api/agent-ai/conversations`
- **Flujo**: Retorna el listado paginado de conversaciones del `AgentId` autenticado, ordenadas por `UpdatedAt DESC`.

### 6. `Features/AgentAi/Endpoints/GetConversationMessagesEndpoint.cs`
- **Ruta**: `GET /api/agent-ai/conversations/{conversationId}/messages`
- **Flujo**: Retorna los últimos ~50 mensajes de una conversación, ordenados cronológicamente (`CreatedAt ASC`), permitiendo offset para cargar anteriores.

### 7. `Features/AgentAi/Services/AgentAiService.cs`
- Modificar el servicio existente.
- Agregar `IAsyncEnumerable<string> StreamResponseAsync(Guid agentId, Guid conversationId, string message, CancellationToken cancellationToken)`.
- Requerir inyección de `ICoreAiToolExecutor` para enviar las tools.
- Cargar historial desde `AgentMessages` y mapearlo a `AiMessage` antes de llamar a `provider.StreamChatAsync`.

### 8. `Features/AgentAi/Services/AgentTitleGeneratorService.cs` (Nuevo)
- Servicio simple que recibe un prompt ("Hazme un resumen de 3-4 palabras para este texto: {mensaje}").
- Utiliza la instancia del LLM configurado (idealmente versiones ligeras/rápidas) para actualizar el `Title` de la `AgentConversation` en `CrmDbContext`.

### 9. `Features/WhatsApp/Services/Tools/ConsultarBaseConocimientoHandler.cs`
- Modificar la consulta `baseQuery`:
  ```csharp
  var baseQuery = _context.DocumentChunks.AsQueryable();
  if (context.Channel != "Copilot") 
  {
      baseQuery = baseQuery.Where(c => c.Audience == DocumentAudience.Public);
  }
  else
  {
      baseQuery = baseQuery.Where(c => c.Audience == DocumentAudience.Public || c.Audience == DocumentAudience.Internal);
  }
  ```

### 10. `Extensions/EndpointRouteBuilderExtensions.cs`
- Registrar los 3 nuevos endpoints bajo el grupo `apiGroup` usando `apiGroup.MapAgentAiEndpoints();` o su registro directo equivalente.
