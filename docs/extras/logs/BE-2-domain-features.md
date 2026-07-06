# Reporte de Auditoría de Logs — Domain Features (Contactos, Propiedades, Interacciones, Intereses, Tareas, Calendario)

**Generado:** 2026-07-05  
**Archivos escaneados:** 64  
**Total logs encontrados:** 22  
**Críticos 🔴:** 3 | **Advertencias 🟡:** 10 | **Revisar 🟢:** 9

---

## 🔴 CRÍTICOS — Eliminar Inmediatamente

### `CRM_Inmobiliario.Api/Features/Contactos/GetDropdownContactos.cs` — Línea 25

```csharp
Console.WriteLine($"[DEBUG] GetDropdownContactos - currentUserId: {currentUserId}, contexto: {contexto}");
```

**Riesgo:** Imprime en consola el `currentUserId` (ID interno del agente autenticado) junto con el parámetro `contexto`. En producción, los IDs de usuario internos en combinación con contextos de acceso constituyen datos de identificación que no deben exponerse en stdout. Cualquier sistema de agregación de logs que capture stdout (Papertrail, Datadog, CloudWatch) recibirá este dato de forma no controlada.  
**Acción:** ELIMINAR. No hay valor de negocio en este log; es debug residual de desarrollo.

---

### `CRM_Inmobiliario.Api/Features/Tareas/RegistrarTarea.cs` — Línea 32

```csharp
Console.WriteLine($"[API] Registrando Tarea: '{command.Titulo}' | Recibido (UTC/Offset): {command.FechaInicio:yyyy-MM-dd HH:mm:ss K} | Local Servidor: {command.FechaInicio.LocalDateTime:yyyy-MM-dd HH:mm:ss}");
```

**Riesgo:** Imprime en claro el **título de la tarea** (`command.Titulo`), que puede contener información personal o sensible del cliente (nombre de contacto, dirección, observaciones sobre una negociación). El campo `Titulo` es ingresado libremente por el usuario. Esto constituye una fuga de PII potencial en el stdout del proceso.  
**Acción:** ELIMINAR. El comentario en el código lo llama `LOG DE AUDITORIA API`, pero usa `Console.WriteLine` en lugar de un sistema de auditoría seguro — es un falso positivo de auditoría.

---

### `CRM_Inmobiliario.Api/Features/Propiedades/Services/PropertyEmbeddingService.cs` — Línea 150

```csharp
Console.WriteLine($"[Gemini Embedding Error] StatusCode: {response.StatusCode}, Content: {errorText}");
```

**Riesgo:** Imprime el `errorText` completo de la respuesta de la API de Gemini. Las respuestas de error de APIs externas pueden contener fragmentos del request original (incluyendo el texto de la propiedad que se intentó embeddir) o metadatos del API key. El `errorText` sin parsear expone arquitectura interna y posiblemente contenido propietario.  
**Acción:** REEMPLAZAR con `_logger.LogError("Gemini Embedding Error. StatusCode: {StatusCode}", response.StatusCode)` — omitir el body completo del error o loguear solo el código HTTP.

---

## 🟡 ADVERTENCIAS — Debug Residual

### `CRM_Inmobiliario.Api/Features/Contactos/ListarContactos.cs` — Línea 154

```csharp
Console.WriteLine($"[API] Calculó Counts en {swCount.ElapsedMilliseconds}ms (Caché Miss)");
```

**Riesgo:** Log de timing/performance en stdout que revela detalles de la estrategia de caché interna (cache miss, latencias). Aunque no contiene PII, expone arquitectura de caché al pipeline de logs. Ruido de debug en producción.  
**Acción:** ELIMINAR o reemplazar con `_logger.LogDebug(...)` si se desea conservar para diagnóstico.

---

### `CRM_Inmobiliario.Api/Features/Contactos/ListarContactos.cs` — Línea 213

```csharp
Console.WriteLine($"[API] ListarContactos (Backend) tardó {sw.ElapsedMilliseconds} ms (Con Datos) para página {request.Page}");
```

**Riesgo:** Log de timing que expone latencias internas y número de página de la paginación. Revela detalles de rendimiento del sistema. Debug residual obvio.  
**Acción:** ELIMINAR o reemplazar con `_logger.LogDebug(...)`.

---

### `CRM_Inmobiliario.Api/Features/Propiedades/EliminarImagenPropiedad.cs` — Línea 43

```csharp
Console.WriteLine($"DEBUG [Storage]: Intento de borrado de {media.StoragePath}. Confirmados por Supabase: {count}");
```

**Riesgo:** Imprime el `StoragePath` del archivo en Supabase Storage. Expone la ruta interna del sistema de almacenamiento, lo que revela convenciones de naming, estructura de buckets y posibles patrones de URL. El prefijo "DEBUG" confirma que es residuo de desarrollo.  
**Acción:** ELIMINAR.

---

### `CRM_Inmobiliario.Api/Features/Propiedades/EliminarImagenPropiedad.cs` — Línea 46

```csharp
Console.WriteLine("ADVERTENCIA [Storage]: Supabase no eliminó el archivo. Verifica permisos RLS o que la Key sea 'service_role'.");
```

**Riesgo:** Expone detalles de configuración de seguridad de Supabase (RLS, `service_role` key). Aunque no contiene datos de usuario, revela la arquitectura de seguridad del sistema al pipeline de logs.  
**Acción:** REEMPLAZAR con `_logger.LogWarning("Storage deletion confirmed 0 files. Check bucket permissions.")` — sin mencionar el tipo de key.

---

### `CRM_Inmobiliario.Api/Features/Propiedades/EstablecerImagenPrincipal.cs` — Línea 53

```csharp
Console.WriteLine($"Error en EstablecerImagenPrincipal: {ex.Message}");
```

**Riesgo:** Log de error en catch block usando `Console.WriteLine`. El `ex.Message` puede contener detalles de la base de datos (nombre de tabla, constraint violada, query parcial). Además, el error también se devuelve al cliente en `Results.Problem($"Error al actualizar la base de datos: {ex.Message}")` — vulnerabilidad doble.  
**Acción:** ELIMINAR el `Console.WriteLine` y reemplazar con `_logger.LogError(ex, "Error en EstablecerImagenPrincipal")`.

---

### `CRM_Inmobiliario.Api/Features/Propiedades/ListarPropiedadesCountsHelper.cs` — Línea 44

```csharp
Console.WriteLine($"[API] Calculó Counts Propiedades en {swCount.ElapsedMilliseconds}ms (Caché Miss)");
```

**Riesgo:** Idéntico al caso de `ListarContactos.cs` L154. Log de timing/caché en stdout, debug residual obvio.  
**Acción:** ELIMINAR o mover a `_logger.LogDebug(...)`.

---

### `CRM_Inmobiliario.Api/Features/Tareas/Jobs/SendWebPushNotificationJob.cs` — Línea 79

```csharp
_logger.LogWarning($"Subscription is invalid or gone for endpoint {outbox.Endpoint}. Status code: {ex.StatusCode}");
```

**Riesgo:** Usa string interpolation (`$""`) en lugar de logging estructurado. Esto anula los beneficios del structured logging y puede afectar rendimiento. El `Endpoint` es la URL del push subscription del navegador del agente — identificador técnico del dispositivo.  
**Acción:** CORREGIR: `_logger.LogWarning("Subscription is invalid or gone for endpoint {Endpoint}. Status code: {StatusCode}", outbox.Endpoint, ex.StatusCode)`.

---

### `CRM_Inmobiliario.Api/Features/Tareas/Jobs/SendWebPushNotificationJob.cs` — Línea 82

```csharp
_logger.LogInformation($"Suscripción inactiva marcada para eliminación: {outbox.Endpoint}");
```

**Riesgo:** Mismo problema que L79 — string interpolation en lugar de structured logging. El endpoint identifica el dispositivo del agente.  
**Acción:** CORREGIR: `_logger.LogInformation("Suscripción inactiva marcada para eliminación: {Endpoint}", outbox.Endpoint)`.

---

### `CRM_Inmobiliario.Api/Features/Tareas/Jobs/TaskNotificationJob.cs` — Línea 96

```csharp
_logger.LogInformation($"Se encontraron {tasksToNotifyFiltered.Count} tareas para notificar.");
```

**Riesgo:** Usa string interpolation en lugar de placeholder estructurado. Menor gravedad — el valor `Count` no es sensible — pero rompe la consistencia del structured logging del job.  
**Acción:** CORREGIR: `_logger.LogInformation("Se encontraron {Count} tareas para notificar.", tasksToNotifyFiltered.Count)`.

---

## 🟢 REVISAR — Logs Potencialmente Legítimos

### `CRM_Inmobiliario.Api/Features/Propiedades/Jobs/PropertyEmbeddingJob.cs` — Línea 33

```csharp
_logger.LogWarning("Property {PropiedadId} not found, skipping embedding generation.", propiedadId);
```

**Riesgo:** Legítimo. Log de background job con GUID interno. Sin PII. Structured logging correcto.  
**Acción:** MANTENER.

---

### `CRM_Inmobiliario.Api/Features/Propiedades/Jobs/PropertyEmbeddingJob.cs` — Línea 41

```csharp
_logger.LogInformation("Successfully updated embedding for property {PropiedadId}.", propiedadId);
```

**Riesgo:** Legítimo. Log de éxito de operación, solo ID interno.  
**Acción:** MANTENER.

---

### `CRM_Inmobiliario.Api/Features/Propiedades/Jobs/PropertyEmbeddingJob.cs` — Línea 45

```csharp
_logger.LogWarning("Failed to generate embedding for property {PropiedadId}.", propiedadId);
```

**Riesgo:** Legítimo. Log de fallo en background job, sin datos sensibles.  
**Acción:** MANTENER.

---

### `CRM_Inmobiliario.Api/Features/Propiedades/Services/PropertyEmbeddingService.cs` — Líneas 85, 89, 104, 108

```csharp
_logger.LogInformation("Attempting OpenAI embedding for property {PropertyId}. Source: {Source}", property.Id, openAiFinalSource);
_logger.LogInformation("Agente OpenAI embedding failed, falling back to Source: {Source} for property {PropertyId}", openAiSource, property.Id);
_logger.LogInformation("Attempting Gemini embedding for property {PropertyId}. Source: {Source}", property.Id, geminiFinalSource);
_logger.LogInformation("Agente Gemini embedding failed, falling back to Source: {Source} for property {PropertyId}", geminiSource, property.Id);
```

**Riesgo:** Legítimos. Logs de trazabilidad del servicio de embedding con IDs de propiedad y nombres de fuente internos. Structured logging correcto.  
**Acción:** MANTENER. Verificar que `openAiFinalSource` / `geminiFinalSource` sean siempre strings constantes internos y nunca incluyan la API key.

---

### `CRM_Inmobiliario.Api/Features/Tareas/Jobs/TaskNotificationJob.cs` — Líneas 34, 51, 92, 150, 152

```csharp
_logger.LogInformation("Iniciando procesamiento de notificaciones de tareas (UTC-5)...");
_logger.LogInformation("No hay agentes activos con suscripciones.");
_logger.LogInformation("No hay tareas pendientes de notificar en este ciclo.");
_logger.LogInformation("Estado de tareas guardado exitosamente en base de datos (con Outbox).");
_logger.LogInformation("Ciclo de notificaciones de tareas completado exitosamente.");
```

**Riesgo:** Legítimos. Mensajes genéricos de ciclo de trabajo sin datos de usuario. Structured logging correcto.  
**Acción:** MANTENER.

---

### `CRM_Inmobiliario.Api/Features/Tareas/Jobs/SendWebPushNotificationJob.cs` — Líneas 48, 89, 100

```csharp
_logger.LogWarning("VAPID keys not configured. Notificaciones Push no se enviarán.");
_logger.LogError(ex, "Drop permanente tras 3 reintentos fallidos. Endpoint: {Endpoint}, Payload: {Payload}", outbox.Endpoint, outbox.Payload);
```

**Riesgo:** L48 legítimo (advertencia de configuración, sin datos de usuario). L89 y L100 problemáticos: loguean `outbox.Payload` completo, que contiene el JSON de la notificación con `task.Titulo` (campo libre que puede incluir PII del cliente).  
**Acción:** L48 MANTENER. L89 y L100 — MODIFICAR: `_logger.LogError(ex, "Drop permanente tras 3 reintentos fallidos. Endpoint: {Endpoint}", outbox.Endpoint)`.

---

## Áreas sin logs

Las siguientes áreas escaneadas **no contienen ningún statement de logging** en ninguno de sus archivos:

| Área | Archivos escaneados | Logs encontrados |
|------|---------------------|------------------|
| **Interacciones** | 3 archivos | 0 |
| **Intereses** | 2 archivos | 0 |
| **Calendario** | 2 archivos | 0 |

---

## Resumen Ejecutivo

El área de **Domain Features** presenta un nivel de riesgo **MEDIO-BAJO** en comparación con otras capas del backend. No se detectaron fugas directas de credenciales (API keys, tokens JWT, connection strings) ni volcados de objetos de entidad completos con datos de usuario. Sin embargo, se identificaron **3 hallazgos críticos** que requieren atención inmediata:

1. **`GetDropdownContactos.cs`** imprime el ID del usuario autenticado en stdout sin control — riesgo de tracking de usuarios en pipelines de logging no seguros.
2. **`RegistrarTarea.cs`** expone el título de la tarea (campo libre de usuario que puede contener PII de clientes) en stdout, catalogado erróneamente en el código como "LOG DE AUDITORIA API".
3. **`PropertyEmbeddingService.cs`** vuelca el body completo de errores de la API de Gemini, exponiendo contenido potencialmente propietario del request fallido.

El patrón más frecuente es el uso de **`Console.WriteLine` para timing y debugging** (6 instancias en Contactos y Propiedades), que en producción alimenta stdout de manera no estructurada y sin control de nivel. En Tareas, los jobs usan `_logger` correctamente pero **3 instancias usan string interpolation** en lugar de placeholders estructurados, lo que rompe el indexado de campos en sistemas como Seq o Application Insights, y en el caso del Payload de push notifications, puede exponer el título de tareas de usuarios. Interacciones, Intereses y Calendario son las áreas más limpias del backend — ningún archivo de estas 3 áreas presenta logging de ningún tipo.
