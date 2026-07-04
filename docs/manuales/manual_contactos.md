# Manual de Contactos: Clientes y Propietarios

Este manual documenta cómo gestionar a tus clientes y las etapas de venta en el CRM.

## 1. Reglas Generales de Clientes

- **Tipos de Cliente:** Todo cliente que agregues puede ser alguien que busca una casa (Prospecto), alguien que vende una casa (Propietario), ¡o incluso ambos al mismo tiempo!
- **Regla de WhatsApp:** Si indicas que el cliente te contactó por WhatsApp, obligatoriamente deberás registrar su número de teléfono para poder escribirle.
- **Teléfonos Únicos:** No puedes tener dos clientes distintos registrados con el mismo número de celular. El sistema revisará esto para evitar que tengas contactos duplicados.

## 2. Etapas de Venta (Embudo Comercial)

Las etapas varían dependiendo de si el cliente busca comprar/alquilar o si es el dueño de una propiedad.

### Para Clientes que Buscan Propiedades (Prospectos)
- **Nuevo:** Es un cliente que acaba de llegar y con el que aún no has empezado a conversar en detalle.
- **Contactado:** Este estado surge automáticamente cuando creas una tarea de tipo "Visita" con el cliente, o puedes seleccionar el estado "Contactado" manualmente en tu lista.
- **Perdido:** El cliente te indicó que ya no quiere comprar o alquilar nada por el momento. Al seleccionar el estado "Perdido", el sistema dejará de hacerle seguimiento.
- **En Negociación y Cerrado:** *(Importante: Estos estados no se pueden seleccionar a mano)*. Solo podrás poner a un cliente como "Cerrado" o "En Negociación" cuando efectivamente le reserves o le vendas una propiedad en el sistema:
  1. El proceso para pasar un cliente a "En Negociación" es poner una propiedad como "Reservada" y asignar a este cliente como el comprador.
  2. El proceso para pasar un cliente a "Cerrado" es poner una propiedad como "Vendida" o "Alquilada" y asignar a este cliente.

### Para Dueños de Propiedades (Propietarios)
- **Activo:** Es un dueño que actualmente tiene propiedades. Se puede asignar este estado manualmente, o el sistema lo hará automáticamente si al menos una de sus propiedades vuelve a estar activa.
- **Inactivo:** Es un propietario con el que has dejado de trabajar. Si se selecciona el estado "Inactivo" manualmente, todas las propiedades enlazadas a ese dueño pasarán a estado "Inactiva". También se asignará automáticamente si TODAS sus propiedades pasan a estado "Inactiva".
- **Cerrado:** *(Automático)* Es el propietario con el que se logró un cierre exitoso. Este estado es **estrictamente automático** y solo ocurre cuando **TODAS** sus propiedades pasan a estado "Vendida" o "Alquilada". No se puede seleccionar manualmente.

## 3. Reglas de Protección de Datos

El sistema bloquea ciertos cambios manuales para evitar errores:

- **Contactos Archivados:** Si mandaste a un cliente a tu archivo, no podrás modificar sus datos a menos que lo restaures. Tampoco podrás crearle tareas ni enviarle mensajes con la IA.
- **Clientes en Negociación:** Si el cliente ya te separó una casa, no puedes cambiar su estado desde aquí; si se arrepiente, debes cancelar la reserva directamente en la propiedad.
- **Negocios Caídos:** Si ya le habías vendido la casa al cliente, no puedes simplemente ponerlo como "Perdido". Tendrías que ir a la casa y marcar que el negocio se cayó.
- **Protección de Tratos:** El sistema no te dejará marcar a un cliente como "Perdido" si actualmente tiene una casa separada o comprada contigo. Tienes que cancelar esos tratos primero.
- **Inactivación de Dueños:** No puedes decir que ya no trabajas con un dueño (Inactivo) si aún tienes casas suyas que están separadas o alquiladas por otros clientes. Si lo marcas como "Inactivo", todas sus casas disponibles se ocultarán del catálogo.

## 4. Automatizaciones del Sistema

- **Recordatorios:** Para ayudarte, en cuanto marcas que tienes una tarea con un cliente, el sistema te creará un recordatorio automáticamente programado para el día siguiente.
- **Nuevas Oportunidades:** Si un cliente al que ya le vendiste una casa (estado "Cerrado") vuelve a buscar otra (estado "Nuevo" o "Contactado"), el sistema registrará una nota automática indicando que inició un nuevo proceso de venta.

## 5. Cuándo un Negocio Falla

Si un negocio se cae (por ejemplo, se cancela una reserva):
- **Liberación de Propiedad:** Si un negocio se cae y el cliente solo tenía una propiedad en reserva, el sistema acomodará todo automáticamente al regresarlo a estado "Perdido" o "Contactado". Si tenía varias propiedades reservadas a la vez, tendrás que ir una por una liberándolas desde el catálogo.
- Al hacer esto, la propiedad vuelve a estar "Disponible" para otros clientes.

## 6. Nivel de Interés

Los contactos pueden registrar un nivel de interés hacia una propiedad. Los niveles válidos son:
- **Alto 🔥**
- **Medio ⚡**
- **Bajo ❄️**
- **Descartada ❌**
Registrar estos intereses actualizará tus estadísticas en el Panel de Control para que sepas en quién enfocarte.

## 7. Historial de Interacciones

Toda la actividad del contacto se registra mediante notas de historial. Los tipos que puedes registrar manualmente son:
- **Nota**
- **Llamada**
- **WhatsApp**
- **Visita**
- **Correo**
Además, el sistema añadirá notas automáticas cuando haya cambios importantes (como ventas o reservas).