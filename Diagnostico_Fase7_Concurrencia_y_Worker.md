# Diagnóstico Fase 7: Concurrencia de Datos y Workers en Background

¡El trabajo en la Fase 6 es excelente!
- El cliente de WhatsApp ahora usa `EnsureSuccessStatusCode()` y relanza excepciones en el bloque catch, lo que garantiza que Hangfire se entere del fallo y active las colas de reintentos. La resiliencia está asegurada.
- Las políticas de seguridad de red en `ServiceCollectionExtensions` ahora anclan el origen CORS exclusivamente a tu variable `FrontendUrl`. El sistema B2B está blindado contra ataques cruzados.

Avanzando un nivel más abajo hacia las tuberías de procesamiento y sincronización entre múltiples agentes simultáneos, he ejecutado la Fase 7 y he detectado 2 fugas estructurales graves:

## 1. Falsa Esperanza de Concurrencia (Last-Write-Wins Data Loss)
**Ubicación:** `ActualizarPropiedad.cs`

**Problema:**
El endpoint de actualización captura maravillosamente el `DbUpdateConcurrencyException`. ¡Pero esto es un espejismo! El `Command` del Frontend **no recibe ningún campo `Version`**. Al ejecutar `await context.Properties.FirstOrDefaultAsync(...)`, Entity Framework lee la fila actualizada por otro agente y adopta ese nuevo `Version` como suyo antes de guardar tus datos.

**Efecto Silencioso:**
Si el Gestor A abre la propiedad para editar el Precio a las 10:00, y el Gestor B la abre a las 10:01 para editar el Título. Si el Gestor B guarda a las 10:02, y el Gestor A guarda a las 10:03... **el Gestor A aplastará el Título del Gestor B sin darse cuenta**.
Nunca se lanzará la excepción de concurrencia porque EF asume que tienes los datos frescos. El Frontend debe enviarte el `Version` actual de la vista y debes inyectarlo con `context.Entry(propiedad).Property(p => p.Version).OriginalValue = command.Version;`.

## 2. Corrupción Silenciosa de Archivos (Silent Data Degradation)
**Ubicación:** `PdfWorker.cs` (Línea 164 - `DownloadImageAsync`)

**Problema:**
Este worker en segundo plano recopila las imágenes de la propiedad para ensamblar la Ficha PDF en QuestPDF. Si la descarga HTTP a Supabase falla por un microcorte o timeout, haces un `catch { return null; }` devolviendo un valor nulo.

**Efecto Silencioso:**
QuestPDF ensamblará un PDF vacío o sin imágenes principales, e inmediatamente lo sobreescribirá en el bucket de Supabase indicándole a la cola `_queue.SetStatus(propiedadId, false)` que terminó "con éxito". No quedará logueado ningún error fuerte, y tus prospectos clientes de WhatsApp o correos descargarán Fichas rotas o sin la foto del departamento. Debes dejar que este método lance la excepción (`throw`) para que Hangfire/BackgroundService interrumpa la generación, no suba PDFs corruptos y lo intente de nuevo en el próximo ciclo.
