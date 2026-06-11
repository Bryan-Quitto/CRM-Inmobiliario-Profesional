# Spec 053: Contactos Filtros Avanzados y Paginación Server-Side

## Objetivo
Migrar la vista del Catálogo de Contactos para que todos los filtros avanzados (Visibilidad, Origen, Estado Propietario, Segmento y Ordenamiento) se evalúen directamente en el servidor (Backend) utilizando Entity Framework Core, resolviendo así el problema donde los filtros post-paginación en el cliente ocultaban resultados erróneamente. Esto debe mantener la arquitectura fluida "Zero-Wait" impuesta por la convención del CRM.

## Especificaciones de Frontend (React 19 / Vite)
1. **Sincronización con URL:** 
   - Todos los parámetros de filtros y el ordenamiento (`SortBy`, `SortDirection`) deben reflejarse como Query Params en la URL usando `useSearchParams`.
   - Modificar el hook `useContactosFiltering.ts` para eliminar variables estáticas ("Todos") y vacías (stubs).
2. **Protección de Navegación Innecesaria:**
   - La evaluación de cambios en el Input de búsqueda debe verificar si `currentQuery !== newQuery` antes de devolver un nuevo objeto de `URLSearchParams`. Esto previene ciclos de re-render en el enrutador que expulsan el foco del usuario mientras escribe.
3. **Optimización SWR:**
   - `useContactosList.ts` pasará los parámetros directamente a la llamada a la API y usará estrictamente `keepPreviousData: true`.
   - Se elimina por completo el filtrado de `Array.prototype.filter` hecho por el lado del cliente.

## Especificaciones de Backend (.NET 10)
1. **Contrato de API (`GetContactosRequest`):**
   - Nuevos parámetros opcionales: `Segmento` (string), `Visibilidad` (string), `Origen` (string), `EstadoPropietario` (string), `SortBy` (string), `SortDirection` (string).
2. **Consultas Nativas (EF Core / LINQ):**
   - Actualizar `ListarContactos.cs` para inyectar condicionalmente sentencias `.Where()` en la consulta base.
   - Asegurar que `Visibilidad` reconozca el valor `"Propios"` en comparación con el Id del Agente logueado, y `"Compartidos"` en caso contrario.
   - El ordenamiento dinámico requiere aplicar las conversiones dentro de LINQ usando `.OrderBy(...)` con base en el valor de la propiedad especificada.
3. **Manejo de EF.Functions:**
   - Las interpolaciones de cadenas para parámetros dinámicos y valores nulos deben materializarse *antes* de ser empaquetadas en las funciones como `EF.Functions.ILike` o `EF.Functions.Unaccent` para no romper la transpilación a PostgreSQL.

## Verificación
- Las búsquedas no deben desvanecer el input del usuario durante la carga (`isLoading` vs Skeletons).
- Los contadores de la capa final ("The One Trip Pattern") deben mantener su exactitud independientemente de los filtros aplicados.
