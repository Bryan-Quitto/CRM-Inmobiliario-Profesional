# Spec 023 - RAG Documental Corporativo (Políticas y Procesos)

## 1. Objetivo
Implementar un sistema RAG (Retrieval-Augmented Generation) para que la IA (a través del canal de WhatsApp) pueda responder preguntas sobre políticas internas de la inmobiliaria (créditos, requisitos, comisiones, etc.) basándose estrictamente en los documentos propios de la empresa, evitando alucinaciones o respuestas genéricas.

## 2. Arquitectura de Base de Datos (PostgreSQL + pgvector)
Se utilizará Supabase (PostgreSQL) con la extensión `pgvector` habilitada. 
Se crearán dos tablas principales a través de migraciones de Entity Framework Core (`dotnet ef database update`):

### `Documents`
Almacena la metadata del documento ingerido.
- `Id` (UUID, PK)
- `Title` (varchar)
- `Source` (varchar) - ej. nombre del archivo o URL
- `CreatedAt` (timestamp with time zone) - Se almacenará ajustado a Ecuador UTC-5.

### `DocumentChunks`
Almacena los fragmentos (párrafos) de los documentos y sus respectivos embeddings vectoriales.
- `Id` (UUID, PK)
- `DocumentId` (UUID, FK a Documents)
- `Content` (text) - Texto plano del chunk.
- `Embedding` (vector(1536)) - Embedding generado por OpenAI `text-embedding-3-small`.
- `ChunkIndex` (int) - Orden del chunk dentro del documento.
- `CreatedAt` (timestamp with time zone)

*Nota: Asegurar la creación de un índice HNSW o IVFFlat en la columna `Embedding` utilizando la métrica de Similitud del Coseno (`vector_cosine_ops`) para optimizar las búsquedas vectoriales.*

## 3. Arquitectura Backend (.NET 10)
Se seguirá estrictamente la **Vertical Slice Architecture**, ubicando la lógica dentro de la carpeta `/Features`.

### 3.1 Fase de Ingestión (`/Features/CorporateKnowledge/IngestDocument`)
**Proceso (Markdown-Only):**
1. **Restricción de Formato:** El endpoint y la UI de administración aceptarán **ÚNICAMENTE** archivos `.md` (Markdown). Cualquier intento de subir un PDF, Word u otro formato será rechazado (HTTP 400). La conversión de PDF a Markdown la realizará el administrador externamente.
2. **Lectura y Parsing:** Recibir el archivo Markdown, cuyo formato estructurado (títulos, listas) previene problemas de ruido (Garbage In, Garbage Out).
3. **Chunking:** Dividir el Markdown en fragmentos semánticos respetando sus encabezados y párrafos (ej. 500-1000 tokens por chunk, asegurando solapamiento si es necesario).
4. **Embeddings:** Llamar a la API de OpenAI (`text-embedding-3-small`) pasando el lote de chunks para obtener los vectores de 1536 dimensiones.
5. **Persistencia ("The One Trip Pattern"):** Guardar el registro en `Documents` y la lista asociada de `DocumentChunks` en una única transacción de base de datos a través de EF Core, aprovechando el *internal pooling* de Npgsql.

### 3.2 Fase de Consulta (`/Features/WhatsApp/ProcessMessage`)
**Integración en el `WhatsAppAiService`:**
1. **Clasificación de Intención:** Evaluar si el mensaje entrante del usuario es una búsqueda de propiedades (fase anterior) o una consulta de información/políticas corporativas.
2. **Vectorización de la Pregunta:** Si es corporativa, generar el embedding de la pregunta del usuario usando `text-embedding-3-small`.
3. **Búsqueda Vectorial (Retrieval):** Ejecutar una consulta usando EF Core contra la tabla `DocumentChunks` usando la distancia del coseno (`OrderBy(c => c.Embedding.CosineDistance(queryVector))`) y tomando los **3 chunks más relevantes** (`Take(3)`).
4. **Generación con Contexto (Augmented Generation):**
   Construir el prompt del sistema (System Prompt) para GPT (ej. `gpt-4o` o `gpt-4o-mini`) inyectando el contenido recuperado:
   
   *Ejemplo de Prompt:*
   > "Eres el asistente virtual de la inmobiliaria. Responde a la pregunta del usuario basándote ESTRICTAMENTE en la siguiente información proporcionada. Si la respuesta no se encuentra en esta información, indica amablemente que no tienes los datos y sugiere contactar a un asesor humano. NO inventes información."
   > 
   > [Contexto Recuperado: Chunk 1, Chunk 2, Chunk 3]

5. **Respuesta al Usuario:** Enviar la respuesta generada por GPT de vuelta a través de la API de WhatsApp.

## 4. Consideraciones y Estándares
- **Conexión a BD:** Conectar a Supabase directamente a través del puerto 5432 con el pooling interno de Npgsql habilitado.
- **Fechas:** Todo `CreatedAt` o estampado de tiempo en la BD debe ajustarse a la zona horaria UTC-5 (`.ToOffset(TimeSpan.FromHours(-5))`).
- **Migraciones:** Todas las estructuras de base de datos deben gestionarse rigurosamente vía CLI de EF Core, asegurando que `pgvector` esté explícitamente configurado en el `DbContext`.
