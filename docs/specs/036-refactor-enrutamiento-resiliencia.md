# Proposal: Refactor Enrutamiento Modelos y Resiliencia

Implementar un enrutamiento de modelos estricto basado en el contexto de uso, integrando resiliencia a nivel de red con Polly para absorber caídas temporales de la API, y eliminando fallos silenciosos (context bleed) para delegar reintentos en Hangfire.

## User Review Required

Revisa estas especificaciones técnicas y confirma si estás de acuerdo con la estrategia de inyección del `HttpClient` con políticas de resiliencia estándar de .NET 10 y los cambios en las firmas del `LLMProviderFactory`.

## Proposed Changes

---

### Program.cs

#### [MODIFY] Program.cs
- Registrar un `HttpClient` nombrado (`LLMProviders`) en el contenedor de dependencias usando `AddHttpClient`.
- Aplicar `AddStandardResilienceHandler(options => { ... })` al cliente.
- Configurar la estrategia para reintentos con Exponential Backoff y Jitter (nativo en Polly v8 / Microsoft.Extensions.Http.Resilience) garantizando la absorción de errores `503 Service Unavailable` y `429 Too Many Requests`.

---

### Capa de Proveedores AI (Features/WhatsApp/Services)

#### [MODIFY] LLMProviderFactory.cs
- Modificar el método `GetProvider` para soportar de manera opcional el ID del modelo objetivo: `GetProvider(string providerName, string apiKey, string? modelId = null)`.

#### [MODIFY] GeminiProvider.cs
- Modificar el constructor para inyectar y recibir `IHttpClientFactory` y `modelId`.
- Invocar el cliente resiliente: `_httpClientFactory.CreateClient("LLMProviders")`.
- Inicializar el cliente oficial `Google.GenAI.Client` inyectando explícitamente el `HttpClient` personalizado con resiliencia: `new Google.GenAI.Client(apiKey: _apiKey, httpClient: httpClient)`.
- Reemplazar cualquier referencia quemada de modelo por la inyección de `modelId`, usando `"gemini-2.5-flash"` como fallback predeterminado si es nulo.

---

### Servicio Orquestador

#### [MODIFY] WhatsAppAiService.cs
- **Model Routing**: En la llamada de resolución para el enrutador semántico, solicitar explícitamente el modelo ultraligero pasándolo como argumento: `_providerFactory.GetProvider("Gemini", apiKey, "gemini-2.5-flash-lite")`.
- **Eliminación del Bypass**: Eliminar el bloque `try-catch` que envuelve al `routerProvider.GetStructuredResponseAsync<ChatIntent>`.
- Permitir que las excepciones HTTP que Polly no pueda absorber tras agotar reintentos (ej. falla prolongada) burbujeen hacia arriba, de modo que Hangfire marque el Job como fallido y lo encole en su propia política de reintento diferido, previniendo el "Context Bleed" y la falla transaccional de Supabase.

## Verification Plan

### Automated / Manual Tests
1. **Model Routing**: Imprimir en los logs o debug gear el modelo invocado (`gemini-2.5-flash-lite` para el enrutador y `gemini-2.5-flash` para el agente principal).
2. **Resilience**: Simular fallos HTTP en Google AI o inspeccionar los logs para validar que Polly intercepta picos transitorios y reintenta de inmediato (backoff) antes de lanzar un error crítico.
3. **Context Bleed (Error Bubbling)**: Validar que si la IA está totalmente caída (y Polly agota los intentos), Hangfire ataja el `ClientError` o `ServerError` y lo manda a `Failed Jobs` sin responder erróneamente al usuario.
