# Manual del Módulo de Contactos y CRM

Este manual documenta las reglas de negocio, validaciones y posibles estados para el módulo de Contactos y CRM del proyecto "CRM Inmobiliario Profesional".

## 1. Reglas Generales de Creación de Contactos

- **Tipos de Contacto:** Un contacto puede clasificarse como **Prospecto** (comprador/arrendatario) y/o **Propietario**.
"Todo cliente que agregues puede ser alguien que busca una casa, alguien que vende una casa, ¡o incluso ambos al mismo tiempo!"
- **Validación de WhatsApp:** Si el origen del contacto es "WhatsApp", es **estrictamente obligatorio** ingresar un número de teléfono.
"Si indicas que el cliente vino por WhatsApp, obligatoriamente deberás registrar su número para poder escribirle."
- **Unicidad de Teléfono:** Un agente no puede registrar múltiples contactos con el mismo número de teléfono. Al guardar, el sistema normaliza el número (formato E.164) y valida que no exista un duplicado en la cartera del agente.
"No puedes tener dos clientes distintos registrados con el mismo número de celular. El sistema revisará esto para que no tengas contactos duplicados."

## 2. Etapas y Estados Permitidos

Las etapas del embudo comercial varían dependiendo de si el contacto es un Prospecto o un Propietario.

### Para Prospectos (Compradores/Inquilinos)
- **Nuevo:** Contacto recién ingresado.
"Es un cliente que acaba de llegar y con el que aún no has empezado a conversar en detalle."
- **Contactado:** Se ha establecido un primer contacto o comunicación.
"Este estado surge automáticamente cuando creaste una tarea de tipo 'Visita' con el cliente, o puedes asignar este estado manualmente en la lista de contactos"
- **Perdido:** El prospecto ya no está interesado o se descartó.
"El cliente te indicó que ya no quiere comprar o alquilar nada por el momento."
*(Las etapas de "En Negociación" y "Cerrado" se administran **exclusivamente** desde el catálogo de propiedades a través de las transacciones. Aunque son visibles en el Kanban y en el detalle del contacto, **no pueden ser seleccionadas manualmente** por el usuario).*
"Solo podrás poner a un cliente como 'Cerrado' o 'En Negociación' cuando efectivamente le reserves o le vendas una propiedad en el sistema. No lo puedes cambiar tú a mano. 

1. El proceso para pasar un cliente a 'En Negociación' es poner a una propiedad como 'Reservada' y que en el campo Cliente final asignes a este cliente
2. El proceso para pasar un cliente a 'Cerrado' es poner a una propiedad como 'Vendida' o 'Alquilada' y y que en el campo Cliente final asignes a este cliente"

### Para Propietarios
- **Activo:** Propietario con propiedades activas en cartera.
"Es un dueño que actualmente tiene propiedades, se puede asignar el estado propietario manualmente, o el sistema lo hará automáticamente si al crear o editar una propiedad asignas a algún contacto como el propietario"
- **Inactivo:** Propietario que ya no es gestionado activamente.
"Es un propietario con el que se ha dejado de trabajar. Si se asigna este estado manualmente todas las propiedades que esten enlazadas a dicho contacto pasaran a estado "Inactiva""
- **Cerrado:** Ciclo concluido.
"Es el propietario con el que se logro un cierre exitoso, este estado no puede ser asignado manualmente, solo ocurre cuando la o las propiedades enlazadas a este propietario estan en estado 'Vendida' o 'Alquilada'."

## 3. Bloqueos Estrictos y Validaciones de Negocio

El sistema previene inconsistencias de datos bloqueando ciertos cambios de estado manuales:

- **Contactos Archivados:** No es posible modificar la etapa o información de un contacto que ha sido archivado.
"Si mandaste a un cliente a tu archivo, no podrás modificar sus datos a menos que lo restaures. Tampoco podras utilizarlo para crear tareas, no se registrarán los mensajes de WhatsApp o Facebook de este contacto, ni podrás activar la IA para el mismo"
- **Prospectos en Negociación:** No puedes cambiar la etapa de un cliente que se encuentre "En Negociación". Cualquier cambio o cancelación debe realizarse desde la transacción de la propiedad.
"Si el cliente ya te separó una casa, no puedes cambiar su estado desde aquí; si se arrepiente, debes cancelar la reserva directamente en la propiedad."
- **Fin de Contrato o Pérdida de Cierre:** No puedes marcar un prospecto "Cerrado" como "Perdido" manualmente. Debes anular la transacción desde la propiedad.
"Si ya le habías vendido la casa al cliente, no puedes simplemente ponerlo como 'Perdido'. Tendrías que ir a la casa y marcar que el negocio se cayó."
- **Protección de Reservas y Cierres (Prospectos):** Si intentas marcar a un prospecto como "Perdido", el sistema verificará que este cliente no posea propiedades con estado "Reservada", "Alquilada" o "Vendida". Debes anular estas operaciones primero.
"El sistema no te dejará marcar a un cliente como 'Perdido' si actualmente tiene una casa separada o comprada contigo. Tienes que cancelar esos tratos primero."
- **Protección de Transacciones (Propietarios):** No puedes marcar a un propietario como "Inactivo" si este tiene inmuebles con transacciones activas (Reservada, Alquilada, Vendida).
"No puedes decir que ya no trabajas con un dueño si aún tienes casas suyas que están separadas o alquiladas por otros clientes."
- **Inactivación de Inmuebles en Cascada:** Cuando logras marcar un propietario como "Inactivo", todas sus propiedades que se encontraban en estado "Disponible" pasan de forma automática a estado "Inactiva".
"Si marcas a un propietario como 'Inactivo', todas sus propiedades pasarán a estar en estado 'Inactiva'."

## 4. Automatizaciones del Sistema

- **Generación de Tareas Automáticas:** Cuando cambias la etapa de un prospecto a "Visita", el sistema genera automáticamente una tarea de tipo "Visita", programada para el día siguiente.
"Para ayudarte a recordar, en cuanto marcas que tienes una tarea con un cliente, el sistema te creará un recordatorio automáticamente."
- **Reinicio de Ciclo Comercial:** Si un cliente que estaba en etapa "Cerrado" pasa de vuelta a "Nuevo" o "Contactado", el sistema registra automáticamente una nota en el historial indicando el inicio de un nuevo ciclo comercial.
"Si un cliente que estaba en etapa "Cerrado" pasa de vuelta a "Nuevo" o "Contactado", el sistema registra automáticamente una nota en el historial indicando el inicio de un nuevo ciclo comercial."

## 5. Reversiones de Estado (Trato Caído)

En caso de que una negociación falle o finalice un contrato, se puede usar la reversión de estado:

- **Regla de 1 Propiedad:** La reversión automática solo funciona si el contacto tiene **exactamente una (1)** propiedad asociada al trato (ya sea en reserva, alquilada o vendida). Si tiene más de una propiedad en esta situación, el sistema bloqueará la reversión masiva y exigirá que el agente libere propiedad por propiedad desde el catálogo de inmuebles.
"Si un negocio se cae y el cliente solo tenía una propiedad en reserva, el sistema acomodará todo automáticamente. Pero si tenía varias a la vez, tendrás que ir una por una liberándolas."
- **Liberación de Propiedad:** Al revertir el estado del cliente a "Perdido" o a una etapa temprana, la propiedad se marca automáticamente de regreso a estado "Disponible", y la transacción queda catalogada como cancelada o completada.
"Al revertir el estado del cliente a "Perdido" o a una etapa temprana, la propiedad se marca automáticamente de regreso a estado "Disponible", y la transacción queda catalogada como cancelada o completada."

## 6. Intereses sobre Propiedades

Los contactos pueden registrar un nivel de interés hacia una propiedad. Los niveles válidos son:
- **Alto 🔥**
- **Medio ⚡**
- **Bajo ❄️**
- **Descartada ❌**

*(El vincular un interés sobre una propiedad actualiza proactivamente las estadísticas y métricas del Dashboard de los agentes).*
"Los contactos pueden registrar un nivel de interés hacia una propiedad. Los niveles válidos son:
- **Alto 🔥**
- **Medio ⚡**
- **Bajo ❄️**
- **Descartada ❌**

*(El vincular un interés sobre una propiedad actualiza proactivamente las estadísticas y métricas del Dashboard de los agentes).*"

## 7. Interacciones (Historial)

Toda la actividad del contacto se registra mediante interacciones. Los tipos de notas / interacciones disponibles para registrar manualmente son:
- **Nota**
- **Llamada**
- **WhatsApp**
- **Visita**
- **Correo**

"Toda la actividad del contacto se registra mediante interacciones. Los tipos de notas / interacciones disponibles para registrar manualmente son:
- **Nota**
- **Llamada**
- **WhatsApp**
- **Visita**
- **Correo**

Además, el sistema añade interacciones automáticas por "Sistema" (Ej: cambio de etapas críticas o reversiones de transacciones)."