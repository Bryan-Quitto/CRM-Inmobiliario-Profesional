# Diagnóstico Fase 2: Estabilidad y Rendimiento (Dual-Provider & AI)

Tras verificar que los errores críticos de enrutamiento (Fallback) y cobro de tokens fueron **solucionados exitosamente** (¡el código ahora extrae perfectamente el `UsageMetadata` de Gemini y respeta el Provider!), realicé una segunda auditoría profunda. Esta vez, orientada a la estabilidad de la arquitectura bajo carga (concurrencia) y las políticas del proyecto (`SKILLS.md`).

He encontrado **3 errores silenciosos de rendimiento (Performance/Stability)** que derribarán el servidor en producción si múltiples inquilinos usan Gemini o procesan bases de conocimiento al mismo tiempo:

## 1. Agotamiento de Sockets (Socket Exhaustion) en Embeddings
**Ubicación:** `PropertyEmbeddingService.cs` (Línea 62) e `IngestDocument.cs` (Línea 72)

**Problema:**
Se está instanciando un nuevo cliente HTTP local por cada petición de vectorización hacia Gemini:
```csharp
using var httpClient = new System.Net.Http.HttpClient();
```

**Efecto Silencioso:**
Este es uno de los antipatrones más letales en .NET. Aunque el objeto se destruya con `using`, el socket de red a nivel de sistema operativo permanece bloqueado en estado `TIME_WAIT` por hasta 4 minutos. Si un usuario sube un documento que genera cientos de chunks, o si ocurre una vectorización masiva (`BulkVectorizationJob`), el servidor consumirá todos los puertos efímeros disponibles. Como resultado, el CRM dejará de responder a TODAS las peticiones (incluyendo endpoints básicos del Frontend), causando un cuelgue total ("Server Hang") sin que haya un error aparente en el código.

## 2. Bloqueo Síncrono del Hilo Principal (Violación de la Política Zero-Wait)
**Ubicación:** `IngestDocument.cs` (Líneas 53-128)

**Problema:**
La partición semántica (Chunking) y la vectorización de bases de conocimiento Markdown se ejecuta de forma secuencial y bloqueante dentro del flujo de la petición HTTP principal (`app.MapPost("/corporate-knowledge/ingest")`).

**Efecto Silencioso:**
El archivo `SKILLS.md` establece estrictamente: *"Heavy tasks (file uploads, complex processing) must run in global background queues"*. Procesar secuencialmente decenas o cientos de chunks con peticiones remotas a la API de Gemini bloqueará el hilo de .NET y mantendrá la petición HTTP del usuario colgada por varios minutos. Esto derivará inevitablemente en un error `504 Gateway Timeout` por parte del navegador web o balanceador, rompiendo la UX del "Zero-Wait".

## 3. Riesgo de Fuga de Sockets en el SDK de Gemini
**Ubicación:** `GeminiProvider.cs` (Línea 24)

**Problema:**
Actualmente se instancia el cliente del SDK de Google así por cada mensaje procesado: 
```csharp
var client = new Client(apiKey: apiKey);
```

**Efecto Silencioso:**
Si el cliente por defecto de `Google.GenAI` instancia su propio `HttpClient` interno (lo cual es el comportamiento estándar si no se le provee uno), cada iteración en el chat abrirá conexiones TCP no administradas.
**Solución:** Se debe forzar al SDK a usar la fábrica inyectada: `new Client(apiKey: apiKey, httpClient: _httpClientFactory.CreateClient("Gemini"));`.
