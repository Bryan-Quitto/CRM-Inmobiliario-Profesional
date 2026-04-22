# SPEC: Ciclo de Vida, Reversión e Historial Inmobiliario

## Contexto Arquitectónico
- **Backend:** .NET 10, Entity Framework Core, Vertical Slice Architecture.
- **Frontend:** React 19, Feature-Sliced Design, SWR (Zero-Wait Policy).
- **Reglas Estrictas:** - IDs basados en `GUID`/`UUID` exclusivamente.
  - Husos horarios en Ecuador UTC-5 usando `.ToOffset(TimeSpan.FromHours(-5))`.
  - The One Trip Pattern (cero `await` múltiples en lecturas).
  - Conexión DB directa al puerto 5432 (sin transaction pooler de Supabase) con pooling interno de Npgsql.

---

## FASE 1: Estructura de Datos y Entidad Transaccional (Backend Core)
**Objetivo:** Crear la base estructural para el historial sin romper analíticas futuras.

1. **Nueva Entidad: `PropertyTransaction` (Dominio)**
   - Crear clase en la capa de dominio.
   - Propiedades:
     - `Id` (Guid, PK)
     - `PropertyId` (Guid, FK a Propiedad)
     - `LeadId` (Guid?, FK a Cliente/Prospecto, nullable para casos de relistado sin cliente)
     - `TransactionType` (Enum/String: "Sale", "Rent", "Cancellation", "Relisting")
     - `Amount` (Decimal?, precio de cierre o alquiler)
     - `TransactionDate` (DateTimeOffset, debe forzarse a UTC-5 en la inserción)
     - `Notes` (String?)
     - `CreatedBy` (Guid, ID del Agente)

2. **Ajuste en Entidad `Property`**
   - Asegurar que mantenga su `EstadoComercial` (Disponible, Vendida, Alquilada).
   - Añadir propiedad de navegación `ICollection<PropertyTransaction> Transactions`.

3. **Migración EF Core**
   - Generar configuración en el `DbContext` (OnModelCreating).
   - El agente CLI debe ejecutar: `dotnet ef migrations add AddPropertyTransactions` y actualizar la base de datos vía CLI, recordando desactivar GssEncryptionMode en la cadena de conexión si aplica.

---

## FASE 2: Casos de Uso - Vertical Slices (Backend API)
**Objetivo:** Implementar la lógica de negocio aislada por features.

1. **Feature: `RelistProperty` (Volver a Listar)**
   - **Ruta:** `POST /api/properties/{id}/relist`
   - **Lógica:**
     - Buscar propiedad por ID (`ExecuteUpdateAsync` si es posible, o cargar y modificar si requiere validación compleja).
     - Cambiar `EstadoComercial` a "Disponible".
     - Insertar nuevo `PropertyTransaction` con tipo "Relisting", `TransactionDate` en UTC-5.
     - Retornar 200 OK.

2. **Feature: `RevertLeadStatus` (Reversión de Cierre)**
   - **Ruta:** `POST /api/leads/{id}/revert-status`
   - **Lógica:**
     - Cambiar estado del Lead.
     - Si se recibe flag `ReleaseProperties = true`, buscar propiedades vinculadas al Lead, cambiar estado a "Disponible" e insertar `PropertyTransaction` tipo "Cancellation".

3. **Feature: `GetPropertyHistory` (Lectura Optimizada)**
   - **Ruta:** `GET /api/properties/{id}/history`
   - **Lógica (The One Trip Pattern):** - Ejecutar un único `.Select()` para proyectar el historial.
   - **Caché:** Implementar `OutputCache` con `SetVaryByRouteValue("id")` y `VaryByValue` basado en el token de autenticación.

---

## FASE 3: UI Reactiva y Zero-Wait (Frontend)
**Objetivo:** Consumir los endpoints con mutaciones optimistas y feedback en tiempo real (<100ms).

1. **Componente: `RelistButton` (Feature: Propiedades)**
   - Ubicación: Vista de Detalle de Propiedad.
   - Acción: Al hacer clic, ejecutar mutación SWR hacia `/api/properties/{id}/relist`.
   - **Zero-Wait:** Usar `mutate` optimista para cambiar el badge de la propiedad a "Disponible" inmediatamente. Mostrar Toast de "Volver a listar" con opción "Undo" de 5 segundos antes de disparar el `fetch` real.

2. **Componente: `ReversionModal` (Feature: Clientes)**
   - Ubicación: Vista de Lead/Prospecto (al cambiar estado desde "Cerrado").
   - Lógica: 
     - Mostrar modal dinámico evaluando si el lead tiene propiedades vinculadas.
     - Checkbox: "¿Liberar propiedad [Nombre] asociada a este cliente?".
     - Ejecutar SWR mutation hacia `/api/leads/{id}/revert-status`.

3. **Componente: `TimelineHistorial` (Feature: Propiedades/Clientes)**
   - Consumir el endpoint de historial implementando `keepPreviousData: true` en la configuración de SWR para evitar parpadeos (flicker-free).
   - Renderizar los hitos con iconografía correspondiente (trofeo para Sale/Rent, flecha de retorno para Relisting/Cancellation).

---

## FASE 4: Mantenimiento del Historial (Edición y Eliminación)
**Objetivo:** Permitir correcciones humanas sobre el registro de transacciones asegurando la consistencia del estado actual de la propiedad.

1. **Feature: `UpdateTransaction` (Backend)**
   - **Ruta:** `PUT /api/transactions/{id}`
   - **Lógica:**
     - Permite actualizar `TransactionDate`, `Amount`, `LeadId` y `Notes`.
     - Validar huso horario (UTC-5) para cualquier modificación de fecha.
     - **Regla de Sincronización:** Si se cambia el `LeadId` y esta es la transacción activa de la propiedad, reflejar el cambio en la vista principal de la propiedad para que el nuevo prospecto quede como el titular actual.
     - Invalidar la `OutputCache` del historial de la propiedad asociada.

2. **Feature: `DeleteTransaction` (Backend)**
   - **Ruta:** `DELETE /api/transactions/{id}`
   - **Lógica:**
     - Eliminar el registro de `PropertyTransaction`.
     - **Regla de Cascada Lógica:** Verificar si la transacción eliminada era la que justificaba el estado actual de la propiedad (ej. la propiedad está "Alquilada" por esta transacción). Si es así, revertir automáticamente el `EstadoComercial` de la `Property` a "Disponible".

3. **UI Panel de Historial (Frontend)**
   - Añadir menú contextual (tres puntos) en cada ítem del `TimelineHistorial` con opciones "Editar" y "Eliminar".
   - **Zero-Wait:** Al eliminar, remover el ítem del timeline inmediatamente con `mutate(data.filter(...), false)` y mostrar Toast de "Undo" de 5 segundos.
   - En el modal de edición, usar pre-poblado rápido desde el caché local de SWR (tanto para la fecha de cierre como para el prospecto)