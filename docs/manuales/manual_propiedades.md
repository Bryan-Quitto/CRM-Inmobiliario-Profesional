# Manual de Propiedades e Inventario

Este documento detalla las reglas de negocio, los estados posibles y la lógica de validación del módulo de Propiedades e Inventario del CRM Inmobiliario Profesional.

## 1. Estados Comerciales de una Propiedad

Las propiedades pueden encontrarse en uno de los siguientes estados comerciales:

- **Disponible**: Estado inicial por defecto cuando se registra una propiedad o cuando se vuelve a listar tras la caída de un trato o la finalización de un contrato.
- **Reservada**: La propiedad está apartada para un cliente potencial.
- **Vendida**: La propiedad ha sido vendida (operación de venta).
- **Alquilada**: La propiedad ha sido alquilada (operación de alquiler).
- **Inactiva**: La propiedad no está disponible en el mercado. Esto ocurre típicamente si el propietario se marca como inactivo.

### Reglas de Transición de Estados
- **No se puede reservar lo cerrado**: Una propiedad que está en estado `Vendida` o `Alquilada` no puede pasar directamente a `Reservada`. Para volver a reservarla, primero debe pasar por el flujo de relistado para volver a estar `Disponible`.
- Concurrencia: Los cambios de estado utilizan control de concurrencia optimista (`Version`). Si dos usuarios intentan cambiar el estado al mismo tiempo, el segundo recibirá una alerta para refrescar y volver a intentar.

## 2. Gestión de Ciclo de Vida (Relistado y Cancelación)

Existen dos flujos principales para que una propiedad cerrada o reservada vuelva al mercado:

### A. Cancelación de Trato (Trato Caído - Mode: Cancel)
Ocurre cuando una venta o alquiler se cae antes de completarse o una reserva se cancela.
- **Transacción**: La transacción activa se marca como `Cancelled`.
- **Contacto (Cliente)**: 
  - Si el cliente tiene otras propiedades compradas/alquiladas, mantiene su estado `Cerrado`.
  - Si el cliente tiene otras propiedades reservadas, pasa a estado `En Negociación`.
  - Si no tiene otros compromisos, retrocede automáticamente al estado `Contactado`.
- **Propiedad**: Regresa al estado `Disponible`.

### B. Relistado Natural (Fin de Ciclo - Mode: Relist)
Ocurre cuando un contrato de alquiler termina y la propiedad vuelve a salir al mercado.
- **Transacción**: La transacción previa se marca como `Completed` exitosamente.
- **Propietario**: Si el propietario estaba `Inactivo`, la propiedad vuelve a listarse pero en estado `Inactiva`. Si el propietario estaba en otro estado, pasa automáticamente a `Activo` y la propiedad queda `Disponible`.

En ambos casos se crea un registro de interacción y un registro en el historial de transacciones de la propiedad, y se invalidan las cachés relevantes (Dashboard, Analytics, Propiedades).

## 3. Seguridad, Permisos y Multi-tenant

El acceso y gestión de propiedades sigue un modelo estricto de visibilidad:
- **Visibilidad Multi-tenant**: Un agente puede ver y gestionar las propiedades que le pertenecen a él o que pertenecen a su **Agencia** (si corresponde a nivel de base de datos).
- **Regla del Creador y Agentes Invitados**: 
  - Si el agente actual registró la propiedad a nombre de un "Agente Invitado" (agente inactivo, sin acceso aún al sistema), el creador puede seguir gestionándola.
  - Si el "Agente Invitado" activa su cuenta, este pasa a tener el **control exclusivo** como dueño/gestor activo de la propiedad y el agente creador original pierde los derechos de modificación de estado.
- **Propiedades Archivadas**: No se permite cambiar el estado de una propiedad que se encuentre archivada por el usuario (`AgentArchivedProperties`).

## 4. Registro de Propiedades (Captación)

Al registrar una nueva propiedad en el sistema:
- **Asignación de Propietario**: Si se vincula a un contacto como propietario, dicho contacto automáticamente adquiere el rol `EsPropietario = true` y pasa a estado `Activo`.
- **Código Único**: A cada propiedad se le asigna un código corto único autogenerado (ej. `PRO-A1B2C`).
- **Captador**: Se puede definir si la captación es "Propia", asignar a un captador existente, o registrar a un "Nuevo Captador" (el cual se crea en el sistema como un Agente inactivo).
- **IA / Embeddings**: Una vez guardada en la base de datos, se lanza un proceso en segundo plano (Hangfire Job) para generar su representación vectorial (Embeddings) utilizada en búsquedas semánticas.

## 5. Gestión de Galería y Multimedia
- Las propiedades pueden agrupar sus imágenes en **Secciones** (ej. "Interiores", "Exteriores", "Amenidades").
- Cada archivo multimedia mantiene un campo de ordenamiento e indica si es la imagen principal (`esPrincipal`), la cual típicamente se usará como portada en los listados.
