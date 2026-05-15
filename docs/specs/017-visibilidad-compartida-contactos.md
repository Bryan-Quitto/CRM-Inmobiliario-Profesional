# Spec 017: Visibilidad Compartida de Contactos

## Propósito
Permitir que los agentes compartan la visibilidad de sus contactos con otros colegas de la misma agencia para facilitar transacciones colaborativas (ventas, alquileres, reservas) sin exponer la base de datos completa ni permitir ediciones no autorizadas.

## Requerimientos

### 1. Modelo de Datos y Persistencia
- **R1.1:** Se debe crear una entidad `ContactoAgenteCompartido` para gestionar la relación N:N entre `Contacto` y `Agent`.
- **R1.2:** Un contacto PUEDE ser compartido con múltiples agentes.
- **R1.3:** Un agente PUEDE tener acceso a múltiples contactos compartidos por otros.

### 2. Lógica de Negocio (Backend)
- **R2.1:** El dueño original del contacto (AgenteId) es el ÚNICO que puede compartir o revocar visibilidad.
- **R2.2:** La búsqueda de agentes para compartir debe permitir:
    - Buscar directamente por nombre/apellido del agente.
    - Buscar por Propiedad (identificar automáticamente al agente responsable de dicha propiedad usando `PropertyPermissionsHelper`).
    - **Feedback Inmediato:** Al seleccionar una propiedad, el modal DEBE mostrar automáticamente el nombre y foto del agente receptor antes de confirmar.
    - **Búsqueda Avanzada:** Las búsquedas en los selectores del frontend DEBEN implementarse con `Fuse.js` para permitir coincidencia difusa (fuzzy search).
- **R2.3:** Si se selecciona una propiedad que NO está "Disponible", el sistema DEBE permitir compartir pero DEBE emitir una advertencia.
- **R2.4:** La revocación DEBE permitir seleccionar uno o más agentes simultáneamente para quitarles el acceso.

### 3. Visibilidad y Restricciones (Frontend/API)
- **R3.1:** Los contactos compartidos DEBEN aparecer en la lista del agente receptor.
- **R3.2:** Identificación Visual: Los contactos compartidos deben incluir un tag informativo: `Agente: [Nombre del Dueño]`.
- **R3.3:** Protección de Datos Sensibles: Para agentes receptores, el `Email` y `Telefono` DEBEN estar ocultos o enmascarados.
- **R3.4:** Restricción de Operaciones: El agente receptor:
    - NO DEBE poder ver el botón de "Detalles" o "Editar".
    - NO DEBE poder cambiar la etapa del embudo (Estado bloqueado con candado).
    - SOLO DEBE poder seleccionar al contacto en modales de transacciones (Venta/Alquiler/Reserva).

## Escenarios

### Escenario: Compartir contacto por propiedad
- **GIVEN** Un agente "A" con un contacto "C".
- **WHEN** El agente "A" decide compartir el contacto "C" seleccionando la propiedad "P" (gestionada por el agente "B").
- **THEN** El sistema identifica al agente "B" como receptor.
- **AND** El contacto "C" ahora es visible para el agente "B" en su lista.

### Escenario: Restricciones de seguridad para el receptor
- **GIVEN** El agente "B" viendo el contacto "C" compartido por "A".
- **WHEN** El agente "B" intenta editar o ver el teléfono del contacto.
- **THEN** Los botones de edición están ausentes y el teléfono se muestra como "********".

### Escenario: Revocación múltiple
- **GIVEN** El agente "A" con un contacto compartido con los agentes "B" y "D".
- **WHEN** El agente "A" selecciona a "B" y "D" en el modal de revocación y confirma.
- **THEN** El contacto "C" desaparece de las listas de los agentes "B" y "D".

## Próximos Pasos
1. Crear migración EF Core para `ContactoAgenteCompartido`.
2. Implementar endpoints `/contactos/{id}/compartir` (POST) y `/contactos/{id}/compartir` (DELETE).
3. Actualizar `ListarContactos` para incluir compartidos con el agente actual.
4. Refactorizar UI de lista de contactos para manejar el estado de "Solo Lectura".
