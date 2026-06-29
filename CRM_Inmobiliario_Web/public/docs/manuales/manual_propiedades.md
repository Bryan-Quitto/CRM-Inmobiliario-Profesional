# Manual de Propiedades e Inventario

Este documento detalla las reglas de negocio, los estados posibles y la lógica de validación del módulo de Propiedades e Inventario del CRM Inmobiliario Profesional.

## 1. Estados Comerciales de una Propiedad

Las propiedades pueden encontrarse en uno de los siguientes estados comerciales:

- **Disponible**: Estado inicial por defecto cuando se registra una propiedad o cuando se vuelve a listar tras la caída de un trato o la finalización de un contrato.
"Es el estado normal de una propiedad lista para ofrecer a tus clientes. Toda propiedad nueva ingresa así."
- **Reservada**: La propiedad está apartada para un cliente potencial.
"Significa que un cliente ya dio un anticipo o separó la propiedad, por lo que no debemos ofrecerla a nadie más por el momento."
- **Vendida**: La propiedad ha sido vendida (operación de venta).
"La propiedad ya tiene un nuevo dueño"
- **Alquilada**: La propiedad ha sido alquilada (operación de alquiler).
"La propiedad está siendo ocupada por un inquilino durante el tiempo que dure su contrato."
- **Inactiva**: La propiedad no está disponible en el mercado. Esto ocurre típicamente si el propietario se marca como inactivo.
"La propiedad ya no se puede ofrecer temporalmente, por ejemplo, si el dueño decidió no vender por ahora."

### Reglas de Transición de Estados
- **No se puede reservar lo cerrado**: Una propiedad que está en estado `Vendida` o `Alquilada` no puede pasar directamente a `Reservada`. Para volver a reservarla, primero debe pasar por el flujo de relistado para volver a estar `Disponible`.
"Si una propiedad ya se vendió o alquiló, no puedes simplemente 'reservarla' de nuevo. Primero tienes que volver a ponerla como Disponible."

## 2. Gestión de Ciclo de Vida (Relistado y Cancelación)

Existen dos flujos principales para que una propiedad cerrada o reservada vuelva al mercado:

### A. Cancelación de Trato (Trato Caído - Mode: Cancel)
Ocurre cuando una venta o alquiler se cae antes de completarse o una reserva se cancela.
"Pasa cuando un negocio no logra cerrarse, como cuando un cliente se arrepiente y cancela su reserva."
- **Transacción**: La transacción activa se marca como `Cancelled`.
"El trato se registra como cancelado en el historial para que lleves el control de lo que pasó."
- **Contacto (Cliente)**: 
  - Si el cliente tiene otras propiedades compradas/alquiladas, mantiene su estado `Cerrado`.
  - Si el cliente tiene otras propiedades reservadas, pasa a estado `En Negociación`.
  - Si no tiene otros compromisos, retrocede automáticamente al estado `Contactado`.
- **Propiedad**: Regresa al estado `Disponible`.

### B. Relistado Natural (Fin de Ciclo - Mode: Relist)
Ocurre cuando un contrato de alquiler termina y la propiedad vuelve a salir al mercado.
"Sucede cuando, por ejemplo, un inquilino se muda porque terminó su contrato y el dueño quiere volver a alquilar la casa."
- **Transacción**: La transacción previa se marca como `Completed` exitosamente.
"El trato de alquiler que acaba de terminar se guarda como un negocio concluido con éxito."
- **Propietario**: Si el propietario estaba `Inactivo`, la propiedad vuelve a listarse pero en estado `Inactiva`. Si el propietario estaba en otro estado, pasa automáticamente a `Activo` y la propiedad queda `Disponible`.

En ambos casos se crea un registro de interacción y un registro en el historial de transacciones de la propiedad.

## 3. Seguridad, Permisos y Multi-tenant

El acceso y gestión de propiedades sigue un modelo estricto de visibilidad:
- **Visibilidad Multi-tenant**: Un agente puede ver y gestionar las propiedades que le pertenecen a él o que pertenecen a su **Agencia** (si corresponde a nivel de base de datos).
"Solo podrás ver y editar tus propias propiedades y las de tu equipo directo, manteniendo la privacidad de la información."
- **Regla del Creador y Agentes Invitados**: 
  - Si el agente actual registró la propiedad a nombre de un "Agente Invitado" (agente inactivo, sin acceso aún al sistema), el creador puede seguir gestionándola.
  - Si el "Agente Invitado" activa su cuenta, este pasa a tener el **control exclusivo** como dueño/gestor activo de la propiedad y el agente creador original pierde los derechos de modificación de estado.
- **Propiedades Archivadas**: No se permite cambiar el estado de una propiedad que se encuentre archivada por el usuario (`AgentArchivedProperties`).
"Si archivaste una propiedad para no verla, no podrás cambiarle el estado a menos que la desarchives primero."

## 4. Registro de Propiedades (Captación)

Al registrar una nueva propiedad en el sistema:
- **Asignación de Propietario**: Si se vincula a un contacto como propietario, dicho contacto automáticamente adquiere el rol `EsPropietario = true` y pasa a estado `Activo`.
"Cuando le asignas un dueño a una nueva propiedad, el sistema automáticamente lo marca como propietario."
- **Código Único**: A cada propiedad se le asigna un código corto único autogenerado (ej. `PRO-A1B2C`).
"El sistema le dará un número de referencia corto a cada casa para que puedas buscarla y encontrarla rápidamente."
- **Captador**: Se puede definir si la captación es "Propia", asignar a un captador existente, o registrar a un "Nuevo Captador" (el cual se crea en el sistema como un Agente inactivo).
"Puedes indicar si la propiedad la conseguiste tú, si fue otro compañero, o registrar a alguien nuevo para reconocer quién trajo el negocio."
- **IA / Embeddings**: Una vez guardada en la base de datos, se lanza un proceso en segundo plano (Hangfire Job) para generar su representación vectorial (Embeddings) utilizada en búsquedas semánticas.
"En cuanto guardas la propiedad, el asistente de Inteligencia Artificial la lee y la aprende en segundos para que luego puedas encontrarla fácilmente con solo describirla."

## 5. Gestión de Galería y Multimedia
- Las propiedades pueden agrupar sus imágenes en **Secciones** (ej. "Interiores", "Exteriores", "Amenidades").
"Para que se vea más organizado, puedes separar las fotos por zonas, como las del patio, las habitaciones o las áreas comunes."
- Cada archivo multimedia mantiene un campo de ordenamiento e indica si es la imagen principal (`esPrincipal`), la cual típicamente se usará como portada en los listados.
"Tú decides el orden de las secciones y eliges cuál será la foto principal que se verá como portada de la propiedad."