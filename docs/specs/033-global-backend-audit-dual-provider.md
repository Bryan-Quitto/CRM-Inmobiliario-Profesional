# Spec 033: Auditoría Global Backend y Limpieza Dual-Provider (OpenAI + Gemini)

## Resumen Ejecutivo
Refactorización integral del backend (`CRM_Inmobiliario.Api`) orientada a la purga de configuraciones y cadenas hardcodeadas de OpenAI. Se consolidó una arquitectura *Dual-Provider* 100% agnóstica utilizando BYOK (Bring Your Own Key) y el `ITenantContext`.

## Objetivos Clave
- **Agnosticismo de Modelos:** Eliminar hardcodeos de strings (ej. `"gpt-4o-mini"`, `"whisper-1"`) implementando el patrón *Options* de .NET a través de la inyección de dependencias (`IOptions<LLMSettings>`).
- **Integridad de PGVector:** Prevenir la corrupción de datos asegurando que los Embeddings generados por Gemini (768 dimensiones) y OpenAI (1536 dimensiones) se inserten en las columnas específicas correspondientes (`GeminiEmbedding` vs `VectorEmbedding`).
- **Delegación Dinámica (Factory):** Obligar a que todos los Handlers de herramientas y servicios de segundo plano (ej. compresión de memoria en WhatsApp) soliciten su instanciación al `LLMProviderFactory` basado en el Agente/Tenant.

## Arquitectura y Componentes
1. **Core & Settings (`LLMSettings.cs`)**:
   - Mapeo fuerte contra `appsettings.json` separando defaults de OpenAI y Gemini. Las variables base pueden ser sobreescritas en producción usando un archivo `.env`.
   - Limpieza de `Agent.cs` e `IngestDocument.cs` al remover el default provider.

2. **Hangfire Background Jobs**:
   - `PropertyEmbeddingJob` modificado para delegar el destino final del vector generado.
   - `BulkVectorizationJob` actualizado para armar dinámicamente el query de LINQ evaluando cuál columna de embedding se encuentra nula.

3. **Inteligencia y Agentes**:
   - `WhatsAppConversationManager` desvinculado de instanciar un `ChatClient` duro de OpenAI.
   - `MarkdownSemanticChunker` configurado para desactivar las restricciones de `Tiktoken` si el proveedor es distinto a OpenAI, recurriendo a un conteo por palabras.

## Estado Actual y Pruebas (To Do)
> [!WARNING]
> La implementación y verificación estática de código han concluido con éxito y el proyecto compila, sin embargo, **aún no se han ejecutado las pruebas de campo ni tests de integración**.

- [ ] **Pruebas de Inserción PGVector (To Do)**: Validar manualmente la inserción masiva de vectores 768d en Supabase usando una cuenta de prueba de Gemini.
- [ ] **Pruebas de Compresión de Memoria (To Do)**: Iniciar una conversación larga simulada en WhatsApp para disparar el background job de compresión semántica asegurando que Gemini logre resumirla sin exigir llaves de OpenAI.
- [ ] **Pruebas de Handlers (To Do)**: Testear `BuscarPropiedadesHandler` empleando cosine distance con la columna `GeminiEmbedding`.
