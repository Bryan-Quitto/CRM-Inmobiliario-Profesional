# Spec 018: Búsqueda Semántica de Propiedades con Vector DB (pgvector)

## 1. Intención y Contexto
Actualmente, el asistente virtual de WhatsApp (`BuscarPropiedadesHandler`) utiliza una búsqueda basada en filtros rígidos (LINQ) intentando coincidir parámetros exactos como tipo, presupuesto, ubicación y palabras clave. Esto fuerza a la IA a extraer estos parámetros del lenguaje natural, lo que a menudo resulta en consultas fallidas si el usuario usa sinónimos o lenguaje muy descriptivo (ej: "casa con patio grande para perros cerca del parque").

**Objetivo:** Migrar la lógica de búsqueda a un modelo de **Búsqueda Semántica Vectorial** utilizando OpenAI Embeddings y la extensión `pgvector` en Supabase (PostgreSQL).

## 2. Alcance (Scope)
- **Base de Datos:** Habilitar la extensión `vector` en Supabase y agregar una columna `VectorEmbedding` a la entidad `Property`.
- **Generación de Embeddings:** Implementar un servicio que, al crear o actualizar una propiedad, construya una cadena descriptiva completa (Título + Descripción + Características) y llame a la API de OpenAI (`text-embedding-3-small`) para generar su vector.
- **Refactorización de IA (WhatsApp):** Simplificar la herramienta `BuscarPropiedades` para que solo reciba un único parámetro `query` (el mensaje crudo o resumido del usuario), lo vectorice, y busque en la base de datos ordenando por distancia vectorial (Similitud del Coseno).

## 3. Decisiones Arquitectónicas (Approach)

### 3.1. Entity Framework Core y Pgvector
- Se instalará el paquete NuGet `Pgvector.EntityFrameworkCore`.
- En `CrmDbContext.cs`, se agregará `modelBuilder.HasPostgresExtension("vector");`.
- En `Property.cs`, se añadirá la propiedad:
  ```csharp
  [Column(TypeName = "vector(1536)")]
  public Vector? VectorEmbedding { get; set; }
  ```

### 3.2. Generación de Embeddings (Pipeline)
- Se creará un `PropertyEmbeddingService` que se ejecutará asíncronamente (usando un Background Queue o un Evento de Dominio) cada vez que una propiedad se guarde o actualice.
- **Modelo a usar:** `text-embedding-3-small` (Rápido, barato y de alta precisión).
- **Texto a vectorizar:** Un string denso. Ejemplo: `[CASA] en [Sector, Ciudad]. Precio: $150000. 3 Habitaciones, 2 Baños. Descripción: Hermosa casa con amplio patio ideal para mascotas...`

### 3.3. Refactor del Tool de WhatsApp
- **AiToolDefinitions.cs:** La herramienta pasará de tener 7 parámetros (`presupuestoMaximo`, `tipo`, `ubicacion`, etc.) a tener solo 1: `query` (string).
- **BuscarPropiedadesHandler.cs:**
  1. Recibe el `query`.
  2. Genera el embedding del `query`.
  3. Ejecuta la consulta EF Core:
     ```csharp
     var results = await _context.Properties
         .Where(p => p.EstadoComercial == "Disponible" || p.EstadoComercial == "Alquilada" || p.EstadoComercial == "Reservada")
         .OrderBy(p => p.VectorEmbedding!.CosineDistance(queryEmbedding))
         .Take(3)
         .ToListAsync();
     ```
  4. Mantiene la salida formateada en CSV que se implementó en la Estrategia 1.

## 4. Riesgos y Consideraciones
- **Migraciones:** La extensión `vector` debe habilitarse explícitamente en la base de datos Supabase antes de aplicar la migración de EF Core.
- **Costo de Embeddings:** El costo de `text-embedding-3-small` es casi nulo ($0.02 por cada millón de tokens), por lo que re-vectorizar el catálogo entero (aprox. 1000 propiedades) costará menos de $0.01.
- **Latencia:** La búsqueda requerirá una llamada HTTP a OpenAI para vectorizar el `query` del usuario antes de consultar la DB. Dado el uso de LLMs, agregar 200ms de latencia es totalmente aceptable.

## 5. Plan de Ejecución (Tasks)
1. Instalar `Pgvector.EntityFrameworkCore` y configurar `CrmDbContext`.
2. Crear la migración `AddPgvectorAndPropertyEmbeddings` y aplicarla.
3. Implementar `OpenAiEmbeddingService` y la lógica de re-vectorización de catálogo.
4. Actualizar `BuscarPropiedadesHandler` y `AiToolDefinitions` para usar la búsqueda semántica.
5. Ejecutar un script "One-Off" para generar los embeddings de todas las propiedades existentes.
