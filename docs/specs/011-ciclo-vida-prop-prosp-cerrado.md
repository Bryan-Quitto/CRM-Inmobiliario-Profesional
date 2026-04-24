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

   ---

## FASE 5: Semántica de Reversión y Ciclos Sucesivos (World-Class UX)
**Objetivo:** Diferenciar técnicamente entre un ciclo comercial que termina exitosamente (ej: fin de alquiler) y un trato que se cae (cancelación), preservando una auditoría estricta.

### 1. Distinción de Acciones en Backend
La capa de dominio no debe ejecutar comandos destructivos (`DELETE`). Se debe añadir una propiedad `TransactionStatus` (ej: "Active", "Completed", "Cancelled") a `PropertyTransaction`.

- **Acción A: Relistado Natural (Fin de Ciclo)**
  - **Uso:** El inquilino se mudó o el contrato terminó. Todo fue un éxito.
  - **Lógica:** - `Property`: `EstadoComercial` -> "Disponible", `CerradoConId` -> NULL.
    - `Lead`: **Sin cambios**. Permanece en su etapa actual (ej. "Cerrado").
    - `Transaction`: La transacción original (`TransactionType = "Rent"`) cambia su `TransactionStatus` de "Active" a "Completed". Se inserta un nuevo registro de `PropertyTransaction` con `TransactionType = "Relisting"`.

- **Acción B: Cancelación de Trato (Trato Caído)**
  - **Uso:** El crédito fue negado o el prospecto se retiró antes de la firma.
  - **Lógica:**
    - `Property`: `EstadoComercial` -> "Disponible", `CerradoConId` -> NULL.
    - `Lead`: **Reversión Automática** a "En Negociación".
    - `Transaction`: La transacción original cambia su `TransactionStatus` a "Cancelled". **Estrictamente prohibido el borrado físico.** Esto preserva la métrica de "Tratos Caídos" para los reportes analíticos.

### 2. Implementación en la UI (Frictionless UX)
Al intentar cambiar el estado de una propiedad "Vendida/Alquilada" a "Disponible", interceptar con un **Modal de Decisión Semántica** (Zero-Wait):

- **Opción 1: "Relistar por Fin de Contrato"** (Icono: Brújula/Refresh)
  - Botón: "Comenzar nuevo ciclo".
  - Subtexto: "El cliente actual mantendrá su historial de cierre exitoso".
- **Opción 2: "Cancelar Operación (Trato Caído)"** (Icono: Alerta/X)
  - Botón: "Anular operación".
  - Subtexto: "El trato se registrará como caído y el cliente volverá a estar 'En Negociación'".

### 3. Soporte para Alquileres Sucesivos Automáticos (Fast-Track)
- Si una propiedad está "Alquilada" y el agente registra un *nuevo* cierre de alquiler con un prospecto distinto, el sistema debe automatizar la transición para evitar fricción.
- **Transacción EF Core:** 1. Ejecuta la lógica de "Acción A: Relistado Natural" sobre la transacción activa anterior (la marca como "Completed").
  2. Inmediatamente inserta la nueva transacción de "Rent" vinculando al nuevo `LeadId`.
  3. Todo ocurre en una sola confirmación a la base de datos para mantener la integridad referencial.

### NOTAS DE INTERACCIÓN (Dropdown de Propiedades)

1. **Casos desde el Dropdown de Estado:**
   **a. De Alquilada a cualquier estado:**
      - Si cambia a `Vendida`: El sistema debe mostrar un modal exigiendo el **Precio de Cierre** Y el **Lead (Prospecto)** comprador. Al confirmar, la transacción de alquiler anterior pasa a `Completed` y se genera la nueva de `Sale`.
   
   **b. De Vendida a cualquier estado:**
      - Si cambia a `Disponible` o `Inactiva`: **NO asumir anulación automática**. Debe saltar el Modal de Decisión Semántica (Relistar Nuevo Ciclo vs Cancelar Trato Caído). Si se elige Cancelar, la `TransactionDate` de anulación debe inyectarse estrictamente bajo `.ToOffset(TimeSpan.FromHours(-5))`.
      - Si cambia a `Alquilada`: Mostrar modal exigiendo **Precio de Alquiler** Y el **Lead (Prospecto)** inquilino. La transacción de venta original pasa a `Completed` (el dueño ahora la pone en alquiler).

   **c. Regla de Reservas (Guardrail):**
      - Si el cambio es hacia `Reservada` desde un estado de cierre (Vendida/Alquilada), bloquear la acción con un toast de error (Zero-Wait) indicando: "Debe marcar la propiedad como Disponible antes de poder reservarla nuevamente."