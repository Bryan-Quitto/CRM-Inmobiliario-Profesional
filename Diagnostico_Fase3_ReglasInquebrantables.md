# Diagnóstico Fase 3: Reglas Arquitectónicas y "Los Inquebrantables"

He revisado las correcciones de la Fase 2 y están perfectamente implementadas (Hangfire, IHttpClientFactory, y Gemini SDK ahora manejan la concurrencia correctamente). ¡Felicidades!

Para esta tercera y última fase del diagnóstico profundo, audité el cumplimiento estricto del archivo `SKILLS.md` (las reglas "Inquebrantables"). 

He encontrado **2 violaciones silenciosas a las reglas inquebrantables** que generarán problemas sutiles a largo plazo (la alerta previa sobre la base de datos fue una falsa alarma, ya que la configuración correcta de Supabase con `Keepalive=1;` vive en el archivo `.env`, tal como lo has apuntado).

## 1. Desalineación Geográfica (Timezone Bug)
**Ubicación:** `ObtenerKpis.cs`, `AnalyticsDateHelper.cs`, `ListarEventos.cs` y otros endpoints analíticos.

**Problema:**
La lógica está calculando los cierres de día y fin de mes utilizando `.ToUniversalTime()` basado en `DateTimeOffset.UtcNow` o el `Offset` enviado por el navegador del cliente.

**Efecto Silencioso:**
El `SKILLS.md` es tajante: *"The system MUST operate under Ecuador's timezone (UTC-5) for all business logic... always use `.ToOffset(TimeSpan.FromHours(-5))`"*. 
Si un agente viaja a España (+02:00) y abre su Dashboard, su `clientDate.Offset` calculará el "fin del día" 7 horas antes de lo debido. Esto hará que sus estadísticas, tareas pendientes y reportes de ventas no coincidan con la base de datos real en Ecuador, rompiendo la consistencia de los reportes financieros a nivel de negocio. 

## 2. Violación del Límite de "Clean Code" (Fat Services)
**Ubicación:** `WhatsAppAiService.cs` (266 líneas) y `GeminiProvider.cs` (290 líneas)

**Problema:**
Ambos servicios monolíticos sobrepasan el límite estricto de complejidad permitido.

**Efecto Silencioso:**
El `SKILLS.md` especifica: *"Feature files MUST NOT exceed 200 lines. If a feature exceeds this limit, its logic must be extracted to specialized helper classes"*. 
Conforme se añadan más proveedores de IA o lógicas de negocio al chat (ej: formateo complejo de Markdown para WhatsApp, parseo de esquemas JSON avanzados de Gemini), estos servicios se volverán inmanejables ("God Classes"). Se debe extraer urgentemente la lógica de mapeo (como el extenso método `ParseSchema` de Gemini o la orquestación del historial de WhatsApp) hacia Helpers independientes (ej. `AiSchemaMapper` o `WhatsAppFormatHelper`).
