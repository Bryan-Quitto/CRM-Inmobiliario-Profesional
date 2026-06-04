# 046 - Escudo Anti-Alucinación y Arquitectura Nivel Dios (Fase 14 Final)

## 1. Contexto y Objetivo
Las herramientas (Function Calling) de IA del CRM confiaban ciegamente en los datos enviados por el LLM y en la estabilidad del asincronismo de .NET. Esto exponía al backend a "alucinaciones" semánticas (textos masivos, nulos, fechas imposibles) y a fallas profundas de estado a nivel de concurrencia y máquina de estados. 

El objetivo evolucionó de simples validaciones de texto a la creación de una **Arquitectura Concurrente Inexpugnable (Nivel 14)**, blindada contra fugas de memoria, cuellos de botella de red, sobreescrituras en BD y DoS lógicos.

## 2. Decisiones de Arquitectura (El Core Definitivo)

### 2.1 Orquestación Asíncrona Aislada (Scope Paralelo)
- **Problema:** `Task.WhenAll` compartía el mismo `IServiceScope` para todas las herramientas paralelas, causando colapsos asíncronos en Entity Framework (no Thread-Safe).
- **Solución:** Inyección de `IServiceScopeFactory`. Cada herramienta paralela se ejecuta en su propia burbuja de memoria (`await using var scope = _scopeFactory.CreateAsyncScope();`). Se utiliza `await using` para un Dispose asíncrono seguro, evitando la asfixia del recolector de basura de .NET.

### 2.2 Aborto Activo de Multihilos (Kamikaze)
- **Problema:** Si una herramienta en paralelo fallaba, las otras seguían consumiendo recursos (falso paralelismo) hasta finalizar.
- **Solución:** Implementación de `CancellationTokenSource.CreateLinkedTokenSource`. Se intercepta cualquier excepción desde dentro del wrapper asíncrono de las Tools y se llama a `linkedCts.CancelAsync()`, matando los demás hilos de inmediato para liberar CPU/RAM.

### 2.3 Atomicidad Financiera (Cero Fugas Económicas ni Lost Updates)
- **Problema:** El coste de Input Tokens de la IA se cobraba de manera acumulativa iterativa, y los hilos chocaban al grabar en BD causando `Lost Updates`. Además, los enteros grandes podían sufrir desbordamiento a negativos (`OverflowException`).
- **Solución:** 
  - Los tokens se acumulan en variables `long` durante las vueltas de la IA y se cobra en BD una única vez al final del request.
  - Bloqueo matemático `try { checked { ... } } catch(OverflowException)`.
  - Exclusión Mutua ACID a través de un `ConcurrentDictionary<string, Lazy<SemaphoreSlim>>` por Agente, con purgador automático `Task.Delay` (10 min) para 100% de limpieza de Memory Leaks.

### 2.4 Bloqueo de Estado-Tiempo (Ghost Locks Erradicados)
- **Problema:** Si un usuario enviaba 5 mensajes en un segundo (Spam), la lectura inicial de la BD desfasaba el historial de la IA, creando respuestas divididas.
- **Solución:** El Semáforo en los Orquestadores (WhatsApp y Copilot) no solo protege la lectura de base de datos, sino que blinda el canal de comunicación reteniendo el candado durante *todo el ciclo de streaming de la IA* hasta el guardado final del historial, forzando la serialidad estricta para cada conversación.

### 2.5 Resiliencia JSON y Fallbacks Nulos
- **Problema:** Si la IA envía una cadena `"null"` u omite un contacto, se generaba un `NullReferenceException` o un bypass del `Deserialize` que quebraba el Hilo principal.
- **Solución:** Caída suave `?.Id ?? Guid.Empty` y aserciones explícitas `if (argsDict == null) throw new JsonException()`. Forzando al Circuit Breaker a actuar.

### 2.6 Circuit Breaker de Inteligencia Artificial
- **Problema:** Modelos obstinados entraban en bucles infinitos de intentos fallidos.
- **Solución:** Si las herramientas lanzan "Errores Críticos" repetidamente, un contador acumulativo detona a los 3 fallos. Se rompe el bucle, se envía un mensaje humano de disculpa y se gatilla automáticamente la herramienta interna `SolicitarAsistenciaHumana`.

## 3. Especificación de Barreras (Data Sanitization)

1. `string ExtractSafeString(JsonElement element, string propName, int maxLength = 500, string defaultValue = "")`
   - Extrae el texto y lo trunca a `maxLength`, con protección extra `char.IsHighSurrogate` para evitar corromper Emojis en el truncamiento.

2. `bool TryExtractSafeDecimal(..., out string error)` / `bool TryExtractSafeFutureDate(...)`
   - Fuerzan reglas cronológicas y matemáticas. Ya no retornan `true` silenciosamente si fallan; devuelven falsos absolutos inyectando el string del "Error Crítico".

## 4. Archivos Modificados e Inyectados
1. `AgentAiService.cs` (Orquestador de Copilot - Refactor total multihilo).
2. `WhatsAppAiService.cs` (Orquestador WhatsApp - Factories y Atomicidad).
3. `BaseCoreAiToolHandler.cs` (Capa utilitaria base de Tools de IA).
4. `ToolExecutionContext.cs` (Contexto liviano basado en IDs, en vez de Entity Trackers completos).
5. `SemanticRouterTests.cs` (Pruebas unitarias actualizadas a Factory y Scopes).