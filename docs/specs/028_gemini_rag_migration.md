# Spec 028: Gemini RAG Migration (Multi-Tenant BYOK)

## Intent
Migrate the vectorization and RAG pipeline to natively support Gemini `text-embedding-004` (768 dimensions) alongside OpenAI `text-embedding-3-small` (1536 dimensions), enabling Multi-Tenant BYOK (Bring Your Own Key) flexibility.

## Scope
- **Database (Postgres/Pgvector):** Added `GeminiEmbedding vector(768)` alongside `OpenAIEmbedding vector(1536)` in relevant domain entities via EF Core migrations.
- **Backend (C# Vertical Slice):** Updated tenant configurations to store embedding provider preferences and keys. Modified the ingestion pipeline to conditionally route embedding generation to the chosen provider. Updated search queries to dynamically use `EF.Functions.VectorDistance` on the active provider's column, adhering strictly to the One Trip Pattern.
- **Frontend (React 19 + FSD):** Updated Tenant settings to allow provider selection (OpenAI/Gemini) and key management, conforming to the Zero Wait Policy.

## Architectural Approach (Parallel Vector Columns)
1. **Schema Evolution:** Explicitly defining parallel columns prevents dimension-mismatch errors in pgvector and simplifies HNSW index creation for each distinct dimensionality.
2. **Ingestion Flow:** Background jobs check the tenant's `EmbeddingProvider` setting, retrieve the BYOK, and calculate vectors only for the active model to save costs.
3. **Query Execution:** Search operations dynamically target the specific vector column based on the tenant's current active provider, guaranteeing fast execution via direct port 5432 pooling.

## Data Models (EF Core)
- `Property.cs` and `DocumentChunk.cs`: Added `public Pgvector.Vector? GeminiEmbedding { get; set; }` mapped to `vector(768)` in the EF Core configuration. Added HNSW index configuration for this new column using `m` and `ef_construction` parameters optimized for 768 dimensions.

## Business Logic (Services & Ingestion)
- `PropertyEmbeddingService.cs` & `IngestDocument.cs`: Resolve `ITenantContext` to check `ActiveLLMProvider`. If OpenAI, use OpenAI SDK and populate `OpenAIEmbedding`. If Gemini, use `Google.GenAI` SDK (`text-embedding-004`) and populate `GeminiEmbedding`.

## Data Access (LINQ)
- `BuscarPropiedadesHandler.cs` & `ConsultarBaseConocimientoHandler.cs`: Use `IQueryable` conditionally so that the `Select` or `OrderBy` uses `EF.Functions.VectorDistance` on the correct column based on the tenant's provider, executing in a single database round-trip.
