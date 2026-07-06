# Reporte de Auditoría de Logs — Infrastructure, Analytics & Gallery

**Generado:** 2026-07-05
**Archivos escaneados:** Decenas de archivos en 8 directorios asignados
**Total logs encontrados:** 30
**Críticos 🔴:** 1 | **Advertencias 🟡:** 23 | **Revisar 🟢:** 6

---

## 🔴 CRÍTICOS — Eliminar Inmediatamente

### `CRM_Inmobiliario.Api/Features/Analitica/ObtenerSeguimiento.cs` — Línea 43
```csharp
logger.LogInformation("Contacto en seguimiento: {Nombre} {Apellido} | Etapa: {Etapa}", contacto.Nombre, contacto.Apellido, contacto.EstadoEmbudo);
```
**Riesgo:** Expone datos personales (nombres y apellidos) de clientes junto a su información comercial, lo cual es una violación de normativas de protección de datos (PII).
**Acción:** ELIMINAR la línea o REEMPLAZAR registrando únicamente el ID del contacto.

---

## 🟡 ADVERTENCIAS — Debug Residual

### `CRM_Inmobiliario.Api/Features/Analitica/ObtenerVentasMensuales.cs` — Línea 34
```csharp
Console.WriteLine($"\n🚀 [SALES CACHE HIT] Agente: {agenteId} | Latencia: {swTotal.ElapsedMilliseconds}ms\n");
```
**Riesgo:** Ruido de debug y exposición de performance/latencia en la consola.
**Acción:** ELIMINAR.

### `CRM_Inmobiliario.Api/Features/Analitica/ObtenerVentasMensuales.cs` — Línea 96
```csharp
Console.WriteLine($"\n⚡ [SALES FALLBACK] Agente: {agenteId} | Latencia: {swTotal.ElapsedMilliseconds}ms\n");
```
**Riesgo:** Ruido de debug y performance tuning.
**Acción:** ELIMINAR.

### `CRM_Inmobiliario.Api/Features/Analitica/ObtenerSeguimiento.cs` — Línea 40
```csharp
logger.LogInformation("--- Analizando Seguimiento Crítico (Filtrado) ---");
```
**Riesgo:** Ruido de debug.
**Acción:** ELIMINAR.

### `CRM_Inmobiliario.Api/Features/Analitica/ObtenerSeguimiento.cs` — Línea 45
```csharp
logger.LogInformation("Total Seguimiento Crítico: {Total}", contactosConInteres.Count);
```
**Riesgo:** Ruido estadístico innecesario en la consola estándar.
**Acción:** ELIMINAR.

### `CRM_Inmobiliario.Api/Features/SeccionesGaleria/ReordenarSecciones.cs` — Línea 57
```csharp
Console.WriteLine($"DEBUG [ReordenarSecciones]: SQL Directo ejecutado. Secciones afectadas: {totalActualizados}");
```
**Riesgo:** Debug obvio que expone métricas de operaciones de base de datos internas.
**Acción:** ELIMINAR.

### `CRM_Inmobiliario.Api/Infrastructure/BackgroundServices/AutoArchivadoJob.cs` — Múltiples Líneas (23, 33, 65, 90, 99)
```csharp
_logger.LogInformation("Iniciando tarea de auto-archivado de contactos y propiedades.");
_logger.LogInformation("No hay agentes con auto-archivado configurado. Finalizando.");
_logger.LogInformation("Agente {AgentId}: Se han auto-archivado {Count} contactos inactivos antes de {Cutoff}.", agent.Id, archivedContactsCount, cutoffContactos);
_logger.LogInformation("Agente {AgentId}: Se han auto-archivado {Count} propiedades inactivas antes de {Cutoff}.", agent.Id, archivedPropertiesCount, cutoffPropiedades);
_logger.LogInformation("Tarea de auto-archivado finalizada.");
```
**Riesgo:** Trazabilidad de worker processes; aunque no exponen PII, generan una gran cantidad de registros en cada ciclo.
**Acción:** EVALUAR reducir a `LogDebug` o ELIMINAR.

### `CRM_Inmobiliario.Api/Infrastructure/BackgroundServices/PdfCleanupWorker.cs` — Múltiples Líneas (22, 36, 44, 49)
```csharp
_logger.LogInformation("🧹 [CLEANUP] Worker de limpieza de PDFs iniciado.");
_logger.LogInformation("🗑️ [CLEANUP] Ejecutando eliminación de PDF para Propiedad: {PropiedadId}", propiedadId);
_logger.LogInformation("✅ [CLEANUP] PDF {FileName} eliminado correctamente de Supabase.", fileName);
_logger.LogError(ex, "❌ [CLEANUP] Error durante la limpieza de un PDF.");
```
**Riesgo:** Excesivo ruido en consola por el worker de fondo de limpieza.
**Acción:** EVALUAR usar un logger estructurado o cambiar a modo Debug.

### `CRM_Inmobiliario.Api/Infrastructure/BackgroundServices/PdfWorker.cs` — Múltiples Líneas (33, 40, 48, 53, 59, 74, 87, 93, 102, 106, 108, 112, 127, 144, 158, 162)
```csharp
// (Fragmento representativo)
_logger.LogInformation("🚀 [WORKER] PdfWorker INICIADO y esperando mensajes en la cola...");
_logger.LogInformation("📥 [WORKER] Mensaje recibido en la cola para Propiedad ID: {PropiedadId}", propiedadId);
_logger.LogInformation("🎨 [WORKER] Intentando descargar logo del agente: {Url}", propiedad.Agente.LogoUrl);
// (y otras docenas de líneas similares)
```
**Riesgo:** El background worker está saturado de logs a nivel Information con emojis (ruido visual), que exponen la ruta de AWS/Supabase internamente en memoria.
**Acción:** REDUCIR a eventos de falla y eliminar el verbose excesivo o cambiar a nivel Debug.

### `CRM_Inmobiliario.Api/Infrastructure/BackgroundServices/TokenLimitResetJob.cs` — Línea 34
```csharp
_logger.LogInformation("Hangfire: Límite diario reseteado para WA ({CountWA}) y FB ({CountFB}) contactos. Bots reactivados.", resultWA, resultFB);
```
**Riesgo:** Ruido de background job, inofensivo.
**Acción:** EVALUAR.

---

## 🟢 REVISAR — Logs Potencialmente Legítimos

### `CRM_Inmobiliario.Api/Features/SeccionesGaleria/EliminarSeccion.cs` — Línea 68
```csharp
Console.WriteLine($"ERROR [DeleteSection]: {ex.Message}");
```
**Riesgo:** Los errores capturados en la capa de negocio no deberían enviarse usando `Console.WriteLine`, sino el sistema de logging para trazas correctas.
**Acción:** REVISAR y migrar a `_logger.LogError`.

### `CRM_Inmobiliario.Api/Features/SeccionesGaleria/ReordenarSecciones.cs` — Líneas 62 y 64
```csharp
Console.WriteLine($"ERROR [ReordenarSecciones]: Error en SQL Directo -> {ex.Message}");
Console.WriteLine($"INNER ERROR: {ex.InnerException.Message}");
```
**Riesgo:** Igual que el anterior; se captura y traga errores imprimiendo en Consola genérica.
**Acción:** REVISAR y migrar a ILogger nativo.

### `CRM_Inmobiliario.Api/Infrastructure/BackgroundServices/AutoArchivadoJob.cs` — Línea 95
```csharp
_logger.LogError(ex, "Error al procesar auto-archivado para el agente {AgentId}.", agent.Id);
```
**Riesgo:** Manejo genérico de fallo de task; loguea un identificador interno seguro.
**Acción:** OK, es legítimo para observabilidad.

### `CRM_Inmobiliario.Api/Infrastructure/Security/SecurityTelemetryFilter.cs` — Línea 85
```csharp
logger.LogWarning("Actividad anómala detectada para el agente {AgenteId}. Visitas: {Count}", agenteId, viewedIds.Count);
```
**Riesgo:** Alerta de telemetría y fraude/abuso. Log legítimo para auditoría de seguridad.
**Acción:** OK, es legítimo mantenerlo.

### `CRM_Inmobiliario.Api/Program.cs` — Línea 136
```csharp
if (context.Response.StatusCode == 401) Console.WriteLine($"WARN [401]: {context.Request.Method} {context.Request.Path}");
```
**Riesgo:** Custom middleware logger para requests no autorizados; es un hack rápido pero expone todas las rutas privadas 401, lo que puede ser abrumador.
**Acción:** REVISAR si vale la pena reemplazarlo por auditorías estructuradas u ocultarlo.

---

## Resumen Ejecutivo
Se analizó de manera exhaustiva la infraestructura, métricas analíticas (dashboard) y la galería, descubriéndose una fuga **crítica de datos personales (PII)** en el módulo de seguimiento donde los nombres completos de contactos están siendo volcados en un `_logger.LogInformation`. Adicionalmente, el núcleo de procesamiento de fondo (BackgroundWorkers, especialmente el `PdfWorker`) tiene un nivel abrumador de impresiones de depuración a la consola mediante logging y Console.WriteLine que deberían desactivarse antes del despliegue masivo o cambiarse a nivel *Debug/Trace* por el alto tráfico de información generada de seguimiento de estado. Por último, algunos bloques *catch* tragan excepciones volcando mensajes en consola en lugar de usar inyección de ILogger.
