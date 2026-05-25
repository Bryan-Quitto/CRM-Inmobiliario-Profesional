# Implementación: RAG Documental Corporativo

## 1. Configuración de Base de Datos y Entidades
- [x] Configurar el `DbContext` de EF Core para registrar y habilitar la extensión `pgvector`.
- [x] Crear la entidad `Document`:
  - `Id` (UUID, PK)
  - `Title` (varchar)
  - `Source` (varchar)
  - `CreatedAt` (DateTimeOffset, ajustado a UTC-5)
- [x] Crear la entidad `DocumentChunk`:
  - `Id` (UUID, PK)
  - `DocumentId` (UUID, FK a `Document`)
  - `Content` (text)
  - `Embedding` (vector(1536))
  - `ChunkIndex` (int)
  - `CreatedAt` (DateTimeOffset, ajustado a UTC-5)
- [x] Configurar los mapeos de EF Core (Fluent API), asegurando un índice vectorial (HNSW o IVFFlat) en la columna `Embedding` usando `vector_cosine_ops`.
- [x] Generar y aplicar la migración usando la CLI de EF Core (`dotnet ef database update`).

## 2. Ingesta de Documentos (`/Features/CorporateKnowledge/IngestDocument`)
- [x] Crear el Command/Endpoint para la subida de archivos dentro de `/Features/CorporateKnowledge/IngestDocument`.
- [x] Implementar validación para permitir **ÚNICAMENTE** la extensión `.md` (rechazar otros formatos con HTTP 400).
- [x] Implementar lógica de lectura y "Chunking" semántico para archivos Markdown (fragmentos de 500-1000 tokens).
- [x] Integrar con la API de OpenAI (`text-embedding-3-small`) para generar los embeddings del lote de chunks.
- [x] Implementar la persistencia de datos (guardar `Document` y múltiples `DocumentChunks`) utilizando "The One Trip Pattern" (una sola transacción a BD).
- [x] Asegurar que las fechas `CreatedAt` se establezcan en Ecuador UTC-5 usando `.ToOffset(TimeSpan.FromHours(-5))`.

## 3. Consulta RAG desde WhatsApp (`/Features/WhatsApp/ProcessMessage`)
- [x] Modificar `WhatsAppAiService` para añadir clasificación de intención de usuario (Búsqueda de Propiedades vs Consulta Corporativa).
- [x] Integrar llamada a la API de OpenAI para vectorizar la pregunta del usuario (`text-embedding-3-small`) si es una Consulta Corporativa.
- [x] Implementar el "Retrieval" (Búsqueda Vectorial) con EF Core usando `OrderBy(c => c.Embedding.CosineDistance(queryVector))` y obtener el Top 3 de chunks.
- [x] Construir el "Augmented Generation": Inyectar el texto de los 3 chunks más relevantes dentro del System Prompt de GPT.
- [x] Ajustar el prompt de GPT con reglas estrictas para evitar alucinaciones, exigiendo responder únicamente basado en el contexto provisto.
- [x] Procesar la respuesta generada por GPT y reenviarla al usuario mediante el canal de WhatsApp.
