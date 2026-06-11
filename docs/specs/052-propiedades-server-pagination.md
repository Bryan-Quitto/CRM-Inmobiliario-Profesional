# 052 - Paginación y Filtros Server-Side para Catálogo de Propiedades

## Intención
Migrar el catálogo de propiedades a una paginación 100% en el lado del servidor, moviendo toda la lógica de búsqueda de texto y los filtros avanzados (precios, rangos, estado, tipo, etc.) desde el Frontend en React hacia consultas dinámicas en Entity Framework. El objetivo principal es poder escalar a catálogos masivos manteniendo la "Zero Wait Policy" estipulada en el proyecto.

## Cambios Implementados

### Backend (CRM_Inmobiliario.Api)
- **Consultas Dinámicas en EF Core:** Se centralizó el filtrado paginado (Skip/Take) y se implementó The One Trip Pattern agrupando totales generales, ventas y alquileres mediante `GroupBy(p => 1)` para minimizar llamadas a la BD.
- **Búsqueda Agnóstica a Tildes:** Se habilitó el soporte para ignorar acentos en las búsquedas en español utilizando `EF.Functions.Unaccent()` combinado con la extensión `unaccent` ya disponible en PostgreSQL.
- **Resolución de Advertencias de EF Core 9+:** Se inyectaron cláusulas `.OrderBy()` en las subconsultas de imágenes principales y cálculos de agregación, resolviendo el warning de ejecución de First/FirstOrDefault.
- **Ordenamiento Determinista:** Se añadió un factor de desempate con `.ThenBy(p => p.Id)` para estabilizar la vista al ordenar por `FechaIngreso`, especialmente útil al hacer seeding masivo donde las fechas son exactamente idénticas.

### Frontend (CRM_Inmobiliario_Web)
- **Sincronización de Estado en la URL:** Se refactorizó `usePropiedadesFiltering.ts` para usar la URL (`searchParams`) como única fuente de verdad para todos los filtros (`estadoComercial`, `tipoPropiedad`, `sortBy`, `sortDirection`, y filtros avanzados), habilitando enlaces compartibles nativos.
- **Zero-Wait UX (Debounce):** La barra de búsqueda opera ahora en un estado híbrido. Las escrituras ocurren en estado local para reflejo instantáneo, mientras que un _debounce_ de 300ms se encarga de inyectar el término final a la URL, conectándose orgánicamente con `keepPreviousData: true` de SWR.
- **Estabilidad del DOM en React:** Se solucionó un bug de desmontaje del componente de filtros moviendo la condición de carga global hacia la grilla interna. Esto previene que el esqueleto destruya el foco del input de texto mientras SWR obtiene los datos de fondo.

## Criterios de Éxito Alcanzados
- [x] El catálogo no recarga la vista completa de filtros durante las búsquedas.
- [x] La barra de texto no pierde foco de escritura en ningún momento.
- [x] EF Core compila sin advertencias de consultas impredecibles.
- [x] "Bogotá" y "Bogota" traen exactamente los mismos resultados.
- [x] Cambiar cualquier filtro reinicia la paginación a `?page=1` de forma segura en la URL.
