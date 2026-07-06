# Reporte de Auditoría de Logs — IA y Core AI

**Generado:** 2026-07-05
**Archivos escaneados:** 49 archivos `.cs` (estimado basado en estructura)
**Total logs encontrados:** 39
**Críticos 🔴:** 6 | **Advertencias 🟡:** 15 | **Revisar 🟢:** 18

---

## 🔴 CRÍTICOS — Eliminar Inmediatamente

### `CRM_Inmobiliario.Api/Features/AgentAi/Services/AgentAiResponseGenerator.cs` — Línea 72
```csharp
_logger.LogInformation("\n=== [Agent AI] Interacción de Usuario ===\nAgentId: {AgentId}\nMensaje: {Message}\n=======================================", agentId, message);
```
**Riesgo:** Loguea el mensaje completo del usuario (PII potencial como nombres, emails, presupuestos, etc).
**Acción:** ELIMINAR / REEMPLAZAR con logeo de metadata sin contenido.

### `CRM_Inmobiliario.Api/Features/AgentAi/Services/AgentAiResponseGenerator.cs` — Línea 91
```csharp
_logger.LogInformation("\n=== [Agent AI] Respuesta de IA ===\nAgentId: {AgentId}\nTokens Totales: {TotalTokens} (Entrada: {InputTokens}, Salida: {OutputTokens})\nRespuesta: {Response}\n================================", agentId, streamTotalTokens ?? 0, streamInputTokens ?? 0, streamOutputTokens ?? 0, textBuilder.ToString());
```
**Riesgo:** Loguea la respuesta completa de la IA, la cual puede contener información personal resumida, además de generar ruido y consumo de disco excesivo.
**Acción:** ELIMINAR (solo loguear métricas de tokens sin el texto).

### `CRM_Inmobiliario.Api/Features/AgentAi/Services/AgentAiStreamProcessor.cs` — Línea 101
```csharp
_logger.LogInformation("\n=== [Agent AI Stream] Interacción de Usuario ===\nAgentId: {AgentId}\nConversationId: {ConversationId}\nMensaje: {Message}\n================================================", agentId, conversationId, message);
```
**Riesgo:** Loguea el payload completo del usuario en la conversación, violando protección de datos si contiene PII.
**Acción:** ELIMINAR / REEMPLAZAR por métricas simples.

### `CRM_Inmobiliario.Api/Features/AgentAi/Services/AgentAiStreamProcessor.cs` — Línea 202
```csharp
_logger.LogInformation("\n=== [Agent AI Stream] Respuesta de IA Final ===\nAgentId: {AgentId}\nConversationId: {ConversationId}\nTokens Totales: {TotalTokens} (Entrada: {InputTokens}, Salida: {OutputTokens})\nRespuesta: {Response}\n===============================================", agentId, conversationId, totalAccumulatedTotalTokens, totalAccumulatedInputTokens, totalAccumulatedOutputTokens, finalFullText.ToString());
```
**Riesgo:** Loguea el payload de respuesta de la IA (posible leak de PII o contexto privado).
**Acción:** ELIMINAR / REEMPLAZAR por logs estructurales de uso de tokens sin la respuesta.

### `CRM_Inmobiliario.Api/Features/AgentAi/Tools/GenerarCotizacionRapidaHandler.cs` — Línea 30
```csharp
_logger.LogInformation("Iniciando generación de cotización rápida. Argumentos RAW: {Args}", args.RootElement.GetRawText());
```
**Riesgo:** Loguea payloads completos de argumentos (`GetRawText()`), los cuales podrían incluir correos, nombres o condiciones financieras del cliente.
**Acción:** ELIMINAR o registrar únicamente las propiedades no sensibles desestructuradas.

### `CRM_Inmobiliario.Api/Features/CoreAi/Tools/RegistrarInteresContactoHandler.cs` — Línea 28
```csharp
_logger.LogInformation("Iniciando RegistrarInteresContacto con Args: {Args}", args.RootElement.GetRawText());
```
**Riesgo:** Exposición de JSON raw con posibles datos sensibles de contacto e interés.
**Acción:** ELIMINAR.

---

## 🟡 ADVERTENCIAS — Debug Residual

### `CRM_Inmobiliario.Api/Features/AI/Services/GeminiApiClient.cs` — Línea 37
```csharp
System.Console.WriteLine($"[GEMINI_PATCH_ERROR] {response.StatusCode}: {err}");
```
**Riesgo:** Uso de `System.Console` (debug residual) y posible exposición del cuerpo del error de Gemini, que podría contener pedazos de los prompts de sistema o datos del usuario.
**Acción:** Reemplazar por `ILogger.LogError` y sanear el contenido de `err`.

### `CRM_Inmobiliario.Api/Features/CoreAi/Jobs/EscalamientoTimerJob.cs` — Línea 47 y 55
```csharp
_logger.LogInformation("EscalamientoTimerJob: contacto {Id} ya no tiene escalación pendiente. Abortando.", contactoId);
_logger.LogInformation("EscalamientoTimerJob: tarea {TareaId} no está pendiente. Abortando.", tareaId);
```
**Riesgo:** Ruido de background job constante.
**Acción:** Evaluar cambiar a `LogDebug` o eliminar.

### `CRM_Inmobiliario.Api/Features/CoreAi/Services/SemanticRouterService.cs` — Línea 59 y 63
```csharp
_logger.LogInformation("Semantic Router: {Intent} detectada.", routerResult.ToString());
_logger.LogInformation("Semantic Router: CONTINUACION detectada.");
```
**Riesgo:** Ruido en consola por cada interacción rutada.
**Acción:** Cambiar a `LogDebug` o eliminar.

### `CRM_Inmobiliario.Api/Features/CoreAi/Tools/BuscarPropiedadesHandler.cs` — Línea 54
```csharp
_logger.LogInformation("Iniciando búsqueda híbrida: Query={Query}, Tipo={Tipo}, Presupuesto={Presupuesto}, Habitaciones={Habitaciones}, Antiguedad={Antiguedad}, Ciudad={Ciudad}, Sector={Sector}", ...);
```
**Riesgo:** Expone todos los parámetros de la búsqueda. Si `Query` contiene texto libre, podría haber PII ingresada por error.
**Acción:** Evaluar eliminar o truncar texto libre.

### `CRM_Inmobiliario.Api/Features/CoreAi/Tools/ConsultarBaseConocimientoHandler.cs` — Línea 32
```csharp
_logger.LogInformation("Iniciando consulta corporativa (RAG): Query={Query}", queryStr ?? "Ninguno");
```
**Riesgo:** El `Query` es texto libre de la pregunta del usuario y podría exponer información sensible.
**Acción:** Considerar eliminar el contenido exacto del Query en logs de Información.

### `CRM_Inmobiliario.Api/Features/CoreAi/Tools/ConsultarDetallesPropiedadHandler.cs` — Línea 40 y 97
```csharp
_logger.LogInformation("Iniciando consulta profunda de propiedad: Nombre={NombrePropiedad}", pNameStr ?? "Ninguno");
_logger.LogInformation("INTERÉS REGISTRADO AUTOMÁTICAMENTE: Contacto {ContactoId} - Propiedad {Propiedad} - Nivel {Nivel}", context.ContactoId, propiedad.Titulo, nivelStr);
```
**Riesgo:** Ruido de seguimiento de flujo y logs transaccionales en la consola.
**Acción:** Bajar a `LogDebug` para seguimiento, y mover registro de negocio a tablas especializadas si es necesario.

### `CRM_Inmobiliario.Api/Features/CoreAi/Tools/RegistrarInteresContactoHandler.cs` — Línea 50
```csharp
_logger.LogInformation("Resolución semántica exitosa: Se mapeó '{Nombre}' al Guid {Guid}", pNameStr, propiedadId);
```
**Riesgo:** Logueo de debugging interno de mapeos.
**Acción:** Bajar a `LogDebug`.

### `CRM_Inmobiliario.Api/Features/CoreAi/Tools/DerivarCaptacionPropietarioHandler.cs` — Línea 138
```csharp
_logger.LogInformation($"[PUSH] Intentando notificar a AgentId {existing.AgenteId} sobre el contacto {existing.Id}");
```
**Riesgo:** String interpolation directo en el log (`$""`) evita structured logging y afecta performance.
**Acción:** Cambiar a template estructurado `_logger.LogInformation("[PUSH] ... {AgenteId} ... {ContactoId}", ...)`.

### `CRM_Inmobiliario.Api/Features/CoreAi/Tools/EnviarFotosPropiedadHandler.cs` — Línea 47
```csharp
_logger.LogInformation("Ejecutando EnviarFotosSeccionPropiedad para propiedad {PropiedadId}, sección {Seccion}, enviarTodas={EnviarTodas}, offset={Offset}", ...);
```
**Riesgo:** Seguimiento de flujo y ruido.
**Acción:** Cambiar a `LogDebug`.

### `CRM_Inmobiliario.Api/Features/IA/ObtenerAuditoriaGeneral.cs` — Línea 47
```csharp
logger.LogInformation("--- OBTENIENDO AUDITORÍA GENERAL IA (Desde {Start} hasta {End}) ---", queryStartDate, queryEndDate);
```
**Riesgo:** Ruido en consola.
**Acción:** Cambiar a `LogDebug`.

### `CRM_Inmobiliario.Api/Features/CorporateKnowledge/Jobs/BulkDocumentVectorizationJob.cs` — Líneas 29, 55, 62
```csharp
_logger.LogInformation("Starting bulk document vectorization job. Force: {Force}", force);
_logger.LogInformation("Found {Count} document chunks to vectorize.", chunkIds.Count);
_logger.LogInformation("Completed enqueuing {Count} document chunk embedding jobs.", chunkIds.Count);
```
**Riesgo:** Logs operacionales de background jobs que ensucian el entorno de producción.
**Acción:** Bajar a `LogDebug`.

### `CRM_Inmobiliario.Api/Features/CorporateKnowledge/Jobs/DocumentChunkEmbeddingJob.cs` — Línea 64
```csharp
_logger.LogInformation("Successfully updated embedding for document chunk {ChunkId}.", chunkId);
```
**Riesgo:** Alta generación de logs (uno por cada chunk procesado en vectorización).
**Acción:** Bajar a `LogDebug`.

---

## 🟢 REVISAR — Logs Potencialmente Legítimos

### `CRM_Inmobiliario.Api/Features/AI/Infrastructure/Handlers/ByokCircuitBreakerHandler.cs`
- Línea 30: `_logger.LogWarning("Fallo de autenticación detectado. Invalidando llave BYOK para Agente: {AgentId}", agentId);`
- Línea 36: `_logger.LogError("Fallo auth, pero AgentId no fue provisto en HttpRequestOptions.");`
- Línea 46: `_logger.LogWarning("Fallo de facturación (Quota Exhausted) detectado. Desactivando IA para Agente: {AgentId}", agentId);`
- Línea 52: `_logger.LogError("Fallo de cuota, pero AgentId no fue provisto en HttpRequestOptions.");`
**Acción:** Legítimos. Manejo de estado crítico de infraestructura externa.

### `CRM_Inmobiliario.Api/Features/AgentAi/Services/AgentAiResponseGenerator.cs`
- Línea 96: `_logger.LogError("Timeout excedido para el Agente {AgentId} (Posible límite de cuota RPM alcanzado).", agentId);`
- Línea 101: `_logger.LogInformation("Operación cancelada por el usuario para el Agente {AgentId}.", agentId);`
- Línea 106: `_logger.LogError(ex, "Error crítico en AgentAiService para {AgentId}", agentId);`
- Línea 119: `_logger.LogError(ex, "Error al registrar uso de tokens en finally para Agente {AgentId}", agentId);`
**Acción:** Legítimos. Manejo de excepciones operacionales.

### `CRM_Inmobiliario.Api/Features/AgentAi/Services/AgentAiStreamProcessor.cs`
- Línea 125: `_logger.LogWarning("Límite de iteraciones excedido para Copilot. Agente {AgentId}. Activando Circuit Breaker.", agentId);`
- Línea 219: `_logger.LogError(ex, "Error al guardar tokens en finally para Agente {AgentId}", agentId);`
**Acción:** Legítimos.

### `CRM_Inmobiliario.Api/Features/AgentAi/Services/AgentAiToolHandler.cs`
- Línea 51: `_logger.LogWarning(ex, "Error al deserializar JSON de los argumentos del tool {Tool}", call.Name);`
- Línea 82: `_logger.LogWarning("Circuit Breaker activado para Copilot. Agente {AgentId}. Demasiados errores críticos.", context.UserId);`
**Acción:** Legítimos.

### `CRM_Inmobiliario.Api/Features/AgentAi/Services/AgentTitleGeneratorService.cs`
- Línea 71: `_logger.LogError(ex, "Error al generar título para la conversación {ConversationId}", conversationId);`
**Acción:** Legítimo.

### `CRM_Inmobiliario.Api/Features/CoreAi/Jobs/EscalamientoTimerJob.cs`
- Línea 98: `_logger.LogError(ex, "EscalamientoTimerJob: error enviando mensaje al cliente {Id} por {Canal}.", contactoId, canal);`
**Acción:** Legítimo.

### `CRM_Inmobiliario.Api/Features/CoreAi/Services/CoreAiToolExecutor.cs`
- Línea 29: `_logger.LogInformation("Ejecutando herramienta: {ToolName} para Usuario {UserId} en {Channel}", toolCall.Name, context.UserId, context.Channel);`
- Línea 39: `_logger.LogWarning("Herramienta no encontrada: {ToolName}", toolCall.Name);`
- Línea 50: `_logger.LogError(ex, "Error ejecutando herramienta {ToolName}", toolCall.Name);`
**Acción:** Legítimos (Logs transaccionales y de errores).

### `CRM_Inmobiliario.Api/Features/CoreAi/Tools/BuscarPropiedadesHandler.cs`
- Línea 94: `_logger.LogWarning("No se pudo generar el embedding para la búsqueda semántica.");`
**Acción:** Legítimo.

### `CRM_Inmobiliario.Api/Features/CoreAi/Tools/ConsultarBaseConocimientoHandler.cs`
- Línea 54: `_logger.LogWarning("No se pudo generar el embedding para la búsqueda RAG.");`
**Acción:** Legítimo.

### `CRM_Inmobiliario.Api/Features/CoreAi/Tools/RegistrarInteresContactoHandler.cs`
- Línea 54: `_logger.LogWarning("RegistrarInteresContacto falló: No se encontró la propiedad con el nombre: {Valor}", pNameStr);`
- Línea 95: `_logger.LogWarning("Previendo descarte automático por presupuesto para Contacto {ContactoId}. Cambiando a 'Bajo'.", context.ContactoId.Value);`
**Acción:** Legítimos.

### `CRM_Inmobiliario.Api/Features/CoreAi/Tools/SolicitarAsistenciaHumanaHandler.cs`
- Línea 119: `_logger.LogInformation($"[PUSH] Intentando notificar a AgentId {contacto.AgenteId} sobre el contacto {contacto.Id}");`
- Línea 147: `_logger.LogWarning($"[PUSH] No se pudo notificar porque contacto.AgenteId está vacío para contacto {contacto.Id}");`
**Acción:** Corregir string interpolation pero su presencia es legítima.

### `CRM_Inmobiliario.Api/Features/IA/ObtenerAuditoriaGeneral.cs`
- Línea 70: `logger.LogError(ex, "Error al obtener auditoría general");`
**Acción:** Legítimo.

### `CRM_Inmobiliario.Api/Features/CorporateKnowledge/Jobs/BulkDocumentVectorizationJob.cs`
- Línea 48: `_logger.LogWarning("Cannot force vectorization: no global API keys configured.");`
**Acción:** Legítimo.

### `CRM_Inmobiliario.Api/Features/CorporateKnowledge/Jobs/DocumentChunkEmbeddingJob.cs`
- Línea 35: `_logger.LogWarning("DocumentChunk {ChunkId} not found, skipping embedding generation.", chunkId);`
- Línea 68: `_logger.LogWarning("Failed to generate embedding for document chunk {ChunkId}.", chunkId);`
**Acción:** Legítimos.

---

## Resumen Ejecutivo
El área de IA y Agentes del sistema contiene **6 logs CRÍTICOS** que están exponiendo en texto plano las interacciones completas (prompts y respuestas enteras) de los usuarios con la IA, así como el payload crudo (`GetRawText()`) de herramientas (Tools). Esto compromete la privacidad al registrar posibles datos sensibles (PII). Además, se detectó un alto volumen de logs a nivel `Information` que ensucian la consola y afectan el desempeño en producción, rastreando detalles operacionales internos (ej. RAG, Semantic Router, y Vectorización masiva) que deberían limitarse a nivel `Debug` o estar desactivados.
