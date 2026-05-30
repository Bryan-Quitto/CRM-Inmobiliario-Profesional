# Diagnóstico de Errores Silenciosos: Arquitectura Dual-Provider (OpenAI / Gemini)

Tras una revisión profunda del backend `CRM_Inmobiliario.Api`, se han identificado **errores silenciosos críticos** relacionados con la integración masiva de la API de AIStudio (Gemini). Estos errores no causan excepciones ni rompen el build (el proyecto compila con 0 errores), pero provocan comportamientos indeseados, enrutamiento incorrecto y fugas analíticas.

A continuación el reporte detallado:

## 1. Ignorar la Selección de Provider (Fallback Silencioso a OpenAI)
**Ubicación:** `Features/WhatsApp/WhatsAppAiService.cs` (Línea 92) y `Features/WhatsApp/Services/Providers/LLMProviderFactory.cs` (Línea 16).

**Problema:**
En el core del bot de WhatsApp (`WhatsAppAiService.cs`), la lógica de fallback para obtener la API Key es la siguiente:
```csharp
// Línea 92
string apiKeyToUse = tenantAgent?.AiApiKey ?? _openAiApiKey ?? "";
var provider = _providerFactory.GetProvider(apiKeyToUse);
```
Si un agente (Tenant) explícitamente configura en su perfil `ActiveLLMProvider = "Gemini"` pero **no provee una llave BYOK** (su `AiApiKey` es nulo), el código no hace fallback a la variable de entorno global `GEMINI_API_KEY`. En su lugar, inyecta por defecto la llave global de OpenAI (`_openAiApiKey`).

Luego, en `LLMProviderFactory.cs`, el proveedor a instanciar se decide **únicamente** evaluando si la llave recibida empieza por `"AIza"`:
```csharp
public ILLMProvider GetProvider(string apiKey) {
    if (apiKey.StartsWith("AIza")) return _geminiProvider;
    return _openAiProvider;
}
```

**Efecto Silencioso:**
Si el agente no pone una API Key propia, el CRM le inyecta la llave de OpenAI. El factory no detecta el prefijo "AIza" en la llave de OpenAI, e instancia silenciosamente el `OpenAiProvider`. El agente operará bajo la inteligencia de OpenAI a pesar de tener seleccionado "Gemini" en su panel, consumiendo el saldo de OpenAI de la empresa.

## 2. Fuga Total en el Registro de Tokens (Billing Ciego para Gemini)
**Ubicación:** `Features/WhatsApp/Services/Providers/GeminiProvider.cs`

**Problema:**
En `GeminiProvider.cs`, la implementación de `StreamChatAsync` procesa correctamente el contenido (texto y tool calls) en el `responseStream`, pero **omite por completo la extracción del uso de tokens** (`UsageMetadata`) de las respuestas de la API de Gemini. 

En contraparte, `OpenAiProvider.cs` sí se encarga de empaquetar estos valores (`aiUpdate.InputTokens = update.Usage.InputTokenCount`, etc.).

**Efecto Silencioso:**
En `WhatsAppAiService.cs` (Línea 197), la persistencia del costo en la base de datos está condicionada:
```csharp
if (streamTotalTokens.HasValue && context.Contacto != null) {
    await _conversationManager.RecordTokenUsageAsync(...);
}
```
Dado que `GeminiProvider` nunca envía las métricas de tokens dentro de los objetos `AiResponseUpdate`, la variable `streamTotalTokens` siempre es `null`. **Ninguna conversación manejada por Gemini registrará su consumo**, rompiendo por completo las métricas del CRM y la tabla `ContactDailyTokenUsage`.

## 3. Resolución Arquitectónica Frágil en el Factory
**Ubicación:** `Features/WhatsApp/Services/Providers/LLMProviderFactory.cs`

**Problema:**
El Factory depende netamente del prefijo de un string (`StartsWith("AIza")`) ignorando la columna `ActiveLLMProvider` de la Base de Datos. Este es un antipatrón. Si Google introduce llaves con otro formato (ej. Vertex AI) o si se usara un Proxy de facturación intermediario que encripte la llave, todo el tráfico de los agentes de Gemini se redirigirá arbitrariamente a OpenAI sin generar logs de advertencia.

---

### Soluciones Propuestas para Corregir estos Errores:

1. **Refactorizar `LLMProviderFactory`**: Modificar la firma a `GetProvider(string providerName, string apiKey)` para que la decisión esté anclada a la configuración del Tenant y no al Regex de una API Key.
2. **Corregir Fallback en `WhatsAppAiService`**: Utilizar lógica ternaria correcta para el sistema de fallback.
   ```csharp
   string providerName = tenantAgent?.ActiveLLMProvider ?? "OpenAI";
   string apiKeyToUse = tenantAgent?.AiApiKey ?? (providerName == "Gemini" ? Environment.GetEnvironmentVariable("GEMINI_API_KEY") : _openAiApiKey) ?? "";
   ```
3. **Mapear Tokens en `GeminiProvider`**: Extraer `UsageMetadata` (ej. `PromptTokenCount` y `CandidatesTokenCount`) en el último fragmento del stream y asignarlos al objeto yield `AiResponseUpdate`.
