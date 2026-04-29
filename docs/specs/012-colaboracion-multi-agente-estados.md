# Spec 012: Colaboración Multi-Agente y Bloqueo de Estados

## 1. Problema y Contexto
En un entorno de agencia (Multi-Tenant), múltiples agentes comparten la visibilidad de las propiedades. Sin embargo, debe existir una distinción clara entre el **Dueño de la Captación** (quien registró la propiedad) y el **Dueño de la Operación** (quien está realizando la venta/alquiler).

Actualmente:
- Los agentes intentan editar propiedades que no les pertenecen, causando errores de permisos (404/403).
- No hay protección que impida a un agente revertir el estado de una propiedad que un compañero tiene en proceso (ej. Reservada).

## 2. Reglas de Negocio (Inquebrantables)

### A. Propiedad de la Captación (Ficha Técnica)
- Solo el **Agente Creador** de la propiedad puede:
    - Editar datos maestros (Título, Descripción, Precio, Ubicación, etc.).
    - Gestionar la Galería (Subir, eliminar o reordenar fotos).
    - Eliminar la propiedad.
- Otros agentes de la misma agencia tienen acceso de **Solo Lectura** a estas secciones.

### B. Propiedad de la Operación (Historial y Transacciones)
- Cualquier agente de la agencia puede registrar una nueva transacción (Reservar, Vender, Alquilar).
- Solo el **Autor de una Transacción** puede editarla o cancelarla.
- **Bloqueo de Estado:**
    - Si una propiedad está en estado `Reservada`, `Vendida` o `Alquilada`, **SÓLO** el agente que realizó dicha transacción puede cambiar el estado a `Disponible` o `Inactiva`.
    - Al intentar un cambio no autorizado, el sistema debe informar quién es el agente responsable del proceso actual.

## 3. Análisis de Riesgos e Impacto Transversal

Para evitar fallos silenciosos y asegurar la integridad del sistema, se identifican los siguientes frentes críticos:

- **Frente 1: ClosingModal (Clientes):** Al cerrar un trato desde la vista de clientes, el selector de propiedades debe filtrar estrictamente por estado `Disponible`. El backend debe rechazar cierres sobre propiedades ya ocupadas (Reservada/Vendida).
- **Frente 2: Edición Rápida (Listados):** Los dropdowns de cambio de estado en los listados deben estar deshabilitados o restringidos visualmente si el usuario no tiene permisos sobre la transacción activa.
- **Frente 3: Integridad de la Galería:** Bloqueo total de handlers de subida/borrado en modo solo lectura para evitar manipulaciones accidentales de la captación ajena.
- **Frente 4: Historial de Transacciones:** Solo el autor de un registro del historial puede modificarlo, garantizando la trazabilidad de la auditoría.

## 4. Requerimientos Técnicos

### Backend (.NET 10)
- **Permisos Centralizados:** El DTO de detalle de propiedad incluirá un objeto `Permissions` que indique explícitamente qué acciones puede realizar el usuario actual (`CanEdit`, `CanManageGallery`, `CanChangeStatus`, etc.).
- **`ObtenerPropiedadPorId`:** Incluir información de la transacción activa actual (AgenteId y Nombre del Agente).
- **`ActualizarPropiedad`:** Validar que el `userId` coincida con `AgenteId` de la propiedad.
- **`CambiarEstadoPropiedad`:** Implementar lógica de validación cruzada entre el estado actual, el nuevo estado y el dueño de la transacción que originó el estado actual.
- **Mensajería Semántica:** Devolver mensajes claros en los errores (400 Bad Request) para ser consumidos por el Frontend.

### Frontend (React 19)
- **UI Condicional (Single Source of Truth):** El frontend consumirá el objeto `Permissions` del backend para habilitar/deshabilitar controles en `PropiedadesList`, `PropiedadDetalle` y `ClosingModal`.
- **Toasts Informativos:** Capturar y mostrar mensajes de error personalizados del backend cuando falle un cambio de estado.
- **Sección Historial:** Bloquear acciones de edición/borrado en registros del historial que no pertenezcan al usuario actual.

## 5. Plan de Implementación

1. **Fase 1 (Backend):** Enriquecer el DTO de detalle de propiedad y proteger el endpoint de actualización.
2. **Fase 2 (Backend):** Implementar el "Guardián de Estados" en el cambio de estado de propiedad.
3. **Fase 3 (Frontend):** UI condicional en Listado, Detalle y Galería.
4. **Fase 4 (Frontend):** Integración de mensajes de error dinámicos en los cambios de estado.

## 5. Criterios de Aceptación
- Un agente A no puede borrar una foto de una propiedad captada por agente B.
- Si agente B tiene una propiedad como "Reservada", el agente A recibe un Toast explicativo al intentar ponerla como "Disponible".
- El historial es visible para todos, pero solo editable por sus respectivos autores.
