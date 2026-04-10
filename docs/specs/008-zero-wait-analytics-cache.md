# 008-zero-wait-analytics-cache

## 1. Background & Motivation
El CRM procesa analíticas, KPIs y el dashboard general en tiempo real, lo que requiere cálculos de todas las entidades (Propiedades, Tareas, Clientes, Interacciones). Actualmente, esto puede provocar tiempos de carga >3s en bases de datos con histórico acumulado, resultando en una mala experiencia de usuario. 
Queremos implementar un patrón de "Procesamiento Proactivo" y "Caché Caliente" para que estos módulos pesados ofrezcan una respuesta instantánea (<300ms) basándose en los estándares de `World-Class Performance` definidos en `SKILLS.md`.

## 2. Objective
Implementar una estrategia de almacenamiento en caché en Backend (.NET 10 OutputCache) con invalidación selectiva por eventos (Tags) y soporte Frontend (SWR Prefetching/Revalidation) para que los paneles de análisis se sirvan instantáneamente.

## 3. Scope & Impact
- **Backend:**
  - `CRM_Inmobiliario.Api/Features/Dashboard/ObtenerKpis.cs`
  - `CRM_Inmobiliario.Api/Features/Analitica/ObtenerActividad.cs`
  - `CRM_Inmobiliario.Api/Features/Analitica/ObtenerEficiencia.cs`
  - `CRM_Inmobiliario.Api/Features/Analitica/ObtenerProyecciones.cs`
  - `CRM_Inmobiliario.Api/Features/Analitica/ObtenerSeguimiento.cs`
  - Endpoints de Mutación (Crear/Editar/Eliminar Tareas, Propiedades, Interacciones y Clientes).
- **Frontend:**
  - Reducción del selector de meses (ocultar meses futuros) en la vista de Analítica/Ventas.
  - SWR Prefetching / Invalidation post-mutación en los formularios.

## 4. Proposed Solution

### 4.1. Backend: Estrategia de OutputCache con Tags
1. Modificar los endpoints de lectura pesados (`ObtenerKpis`, `ObtenerActividad`, etc.) para que usen `OutputCache` con tags específicos:
   - `dashboard-data-{AgentId}`
   - `analytics-data-{AgentId}`
   - *Nota:* Se incluye el `AgentId` en el tag para evitar que la invalidación de un usuario borre la caché de otro usuario.
2. Modificar los endpoints de mutación (ej. `RegistrarTarea.cs`, `ActualizarPropiedad.cs`, `CambiarEtapaCliente.cs`) para que reciban `IOutputCacheStore`.
3. Al finalizar una mutación exitosa, invocar la invalidación de los tags asociados al agente actual:
   ```csharp
   await cacheStore.EvictByTagAsync($"dashboard-data-{agenteId}", cancellationToken);
   await cacheStore.EvictByTagAsync($"analytics-data-{agenteId}", cancellationToken);
   ```

### 4.2. Frontend: Filtros Inteligentes
En la sección de Ventas y KPIs, los filtros de tiempo consumen recursos y pueden confundir.
- Ocultar meses y semanas futuras. Si el mes actual es Abril (4), el selector solo mostrará de Enero a Abril.
- Esto reduce las consultas inútiles de meses vacíos y mejora la UX.

### 4.3. Frontend: Revalidación Silenciosa (UPSP)
Aplicar el Patrón UPSP (Ultra-Premium Sync Pattern) del proyecto:
- Al terminar de guardar (Ej. crear tarea), ejecutar una mutación silenciosa de SWR hacia los endpoints de dashboard/analítica.
- Como la API ya invalidó la caché backend y va a generar un nuevo cálculo limpio, al usuario no le costará tiempo la próxima vez que entre al Dashboard, los datos ya estarán procesados y cacheados.

## 5. Alternatives Considered
- *WebSockets / SignalR:* Se descartó porque añade una capa de complejidad asíncrona y de infraestructura innecesaria para <= 10 usuarios. La caché por request HTTP es más stateless y encaja mejor con la arquitectura actual de SWR.
- *Background Workers (Quartz/Hangfire):* Podrían precalcular y guardar en tablas pre-agregadas. Se descarta temporalmente para evitar desnormalizar la BD. El EF Core Split Query + OutputCache debería ser suficiente.

## 6. Implementation Plan
- **Fase 1:** Limitar el selector de meses en el Frontend (`CRM_Inmobiliario_Web/src/features/analitica/components/...`).
- **Fase 2:** Configurar y aplicar `OutputCache` con Tags en los Endpoints de Dashboard y Analítica en el Backend.
- **Fase 3:** Inyectar `IOutputCacheStore` en los comandos de Mutación (Tareas, Propiedades, etc.) e invalidar la caché tras el éxito.
- **Fase 4:** Actualizar los hooks del frontend para hacer prefetch post-mutación.

## 7. Verification & Testing
1. Ingresar al Dashboard (debe mostrar los datos o calcularlos por primera vez y guardarlos en caché).
2. Modificar una Tarea o Propiedad.
3. Verificar mediante los Logs de consola (Kestrel) que la caché fue invalidada y que el siguiente request al Dashboard vuelva a ejecutar la consulta SQL, cacheándola nuevamente.
4. Validar que en Frontend el combo de meses de Analítica no pase del mes en curso.

## 8. Migration & Rollback
No requiere cambios en la estructura de base de datos. En caso de error, basta con remover la directiva `.CacheOutput()` de los endpoints afectados y eliminar el `EvictByTagAsync`.