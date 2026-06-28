# Manual del Módulo de Contactos y CRM

Este manual documenta las reglas de negocio, validaciones y posibles estados para el módulo de Contactos y CRM del proyecto "CRM Inmobiliario Profesional".

## 1. Reglas Generales de Creación de Contactos

- **Tipos de Contacto:** Un contacto puede clasificarse como **Prospecto** (comprador/arrendatario) y/o **Propietario**.
- **Validación de WhatsApp:** Si el origen del contacto es "WhatsApp", es **estrictamente obligatorio** ingresar un número de teléfono.
- **Unicidad de Teléfono:** Un agente no puede registrar múltiples contactos con el mismo número de teléfono. Al guardar, el sistema normaliza el número (formato E.164) y valida que no exista un duplicado en la cartera del agente.

## 2. Etapas y Estados Permitidos

Las etapas del embudo comercial varían dependiendo de si el contacto es un Prospecto o un Propietario.

### Para Prospectos (Compradores/Inquilinos)
- **Nuevo:** Contacto recién ingresado.
- **Contactado:** Se ha establecido un primer contacto o comunicación.
- **Cita:** Se ha programado una visita o reunión. *(Nota UI: Esta etapa es de uso interno/automatizado y no se muestra como opción manual en los menús desplegables).*
- **Perdido:** El prospecto ya no está interesado o se descartó.

*(Las etapas de "En Negociación" y "Cerrado" se administran **exclusivamente** desde el catálogo de propiedades a través de las transacciones. Aunque son visibles en el Kanban y en el detalle del contacto, **no pueden ser seleccionadas manualmente** por el usuario).*

### Para Propietarios
- **Activo:** Propietario con propiedades activas en cartera.
- **Inactivo:** Propietario que ya no es gestionado activamente.
- **Retirado:** Propietario que retira sus propiedades. *(Nota UI: Esta etapa es de uso interno del sistema y no es seleccionable manualmente en la interfaz).*
- **Cerrado:** Ciclo concluido.

## 3. Bloqueos Estrictos y Validaciones de Negocio

El sistema previene inconsistencias de datos bloqueando ciertos cambios de estado manuales:

- **Contactos Archivados:** No es posible modificar la etapa o información de un contacto que ha sido archivado.
- **Prospectos en Negociación:** No puedes cambiar la etapa de un cliente que se encuentre "En Negociación". Cualquier cambio o cancelación debe realizarse desde la transacción de la propiedad.
- **Fin de Contrato o Pérdida de Cierre:** No puedes marcar un prospecto "Cerrado" como "Perdido" manualmente. Debes anular la transacción desde la propiedad.
- **Protección de Reservas y Cierres (Prospectos):** Si intentas marcar a un prospecto como "Perdido", el sistema verificará que este cliente no posea propiedades con estado "Reservada", "Alquilada" o "Vendida". Debes anular estas operaciones primero.
- **Protección de Transacciones (Propietarios):** No puedes marcar a un propietario como "Inactivo" si este tiene inmuebles con transacciones activas (Reservada, Alquilada, Vendida).
- **Inactivación de Inmuebles en Cascada:** Cuando logras marcar un propietario como "Inactivo", todas sus propiedades que se encontraban en estado "Disponible" pasan de forma automática a estado "Inactiva".

## 4. Automatizaciones del Sistema

- **Generación de Tareas Automáticas:** Cuando cambias la etapa de un prospecto a "Cita", el sistema genera automáticamente una tarea de tipo "Visita", programada para el día siguiente.
- **Reinicio de Ciclo Comercial:** Si un cliente que estaba en etapa "Cerrado" pasa de vuelta a "Nuevo" o "Contactado", el sistema registra automáticamente una nota en el historial indicando el inicio de un nuevo ciclo comercial.

## 5. Reversiones de Estado (Trato Caído)

En caso de que una negociación falle o finalice un contrato, se puede usar la reversión de estado:

- **Regla de 1 Propiedad:** La reversión automática solo funciona si el contacto tiene **exactamente una (1)** propiedad asociada al trato (ya sea en reserva, alquilada o vendida). Si tiene más de una propiedad en esta situación, el sistema bloqueará la reversión masiva y exigirá que el agente libere propiedad por propiedad desde el catálogo de inmuebles.
- **Liberación de Propiedad:** Al revertir el estado del cliente a "Perdido" o a una etapa temprana, la propiedad se marca automáticamente de regreso a estado "Disponible", y la transacción queda catalogada como cancelada o completada.

## 6. Intereses sobre Propiedades

Los contactos pueden registrar un nivel de interés hacia una propiedad. Los niveles válidos son:
- **Alto 🔥**
- **Medio ⚡**
- **Bajo ❄️**
- **Descartada ❌**

*(El vincular un interés sobre una propiedad actualiza proactivamente las estadísticas y métricas del Dashboard de los agentes).*

## 7. Interacciones (Historial)

Toda la actividad del contacto se registra mediante interacciones. Los tipos de notas / interacciones disponibles para registrar manualmente son:
- **Nota**
- **Llamada**
- **WhatsApp**
- **Visita**
- **Correo**

Además, el sistema añade interacciones automáticas por "Sistema" (Ej: cambio de etapas críticas o reversiones de transacciones).
