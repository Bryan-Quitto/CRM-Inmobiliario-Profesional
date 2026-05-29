# Prompt para Sesión 1: Migración de Vectorización y RAG a Gemini

**Contexto para la nueva sesión:**
Copia y pega el siguiente texto en una **nueva sesión** de chat para iniciar el ciclo SDD de esta primera tarea.

---

**Copia desde aquí:**

Hola Gemini, inicia tu contexto usando `mem_context` para el proyecto "CRM Inmobiliario Profesional" y lee detenidamente `SKILLS.md`. 

Una vez que estés en contexto, quiero que inicies un flujo SDD (Spec-Driven Development) para la siguiente tarea arquitectónica de alta complejidad:

**Objetivo:** Migrar la estrategia de Vectorización (Embeddings) y RAG de OpenAI a Gemini.

**Contexto Técnico:**
1. Actualmente usamos `text-embedding-3-small` de OpenAI (1536 dimensiones) en `PropertyEmbeddingService.cs` e `IngestDocument.cs`.
2. Hacemos búsquedas RAG usando `CosineDistance` en `Pgvector` (PostgreSQL) en `ConsultarBaseConocimientoHandler.cs` y `BuscarPropiedadesHandler.cs`.
3. Para Gemini, debemos usar el modelo `text-embedding-004` mediante la SDK `Google.GenAI`.
4. **Problema Crítico:** El modelo de Gemini entrega **768 dimensiones** por defecto, lo cual entra en conflicto con las columnas actuales de la base de datos (1536). Como somos Multi-Tenant y soportamos BYOK (trae tu propia llave), debemos diseñar una estrategia a nivel de Base de Datos (EF Core) para manejar la dualidad de dimensiones (ej. adaptar la columna actual, crear una columna nueva `EmbeddingGemini`, o usar coerción de dimensiones si la API de Gemini lo soporta).

**Instrucciones SDD:**
1. Inicia con `/sdd-explore` para investigar la base de datos, `Property`, `DocumentChunk`, y los servicios mencionados. Evalúa las posibles soluciones al conflicto de dimensionalidad para nuestro ecosistema Multi-Tenant.
2. Luego, genera la propuesta técnica y el diseño (`/sdd-propose` y `/sdd-design`).
3. Detente y pídeme aprobación antes de pasar a la fase de tareas (`/sdd-tasks`). ¡Asegúrate de respetar las reglas Inquebrantables del backend (The One Trip Pattern, Vertical Slice Architecture)!

**Fin del copiado.**
