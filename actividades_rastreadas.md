# Actividades que Actualizan el Timeline del Agente (LastActivityUtc)

A continuación se enumera el inventario completo de acciones dentro del CRM que dispararán la actualización de la actividad reciente. 
*Nota de Arquitectura:* A nivel de base de datos, no se utiliza un único campo monolítico; el tracking se delega a las entidades puente `AgentContactActivity` y `AgentPropertyActivity` actualizando el campo `LastActivityUtc` mediante Upserts. Esto asegura que la actividad reciente es específica por Agente, manteniendo el registro "vivo" y evitando que sea archivado por el daemon.

## Contactos

1. **Edición General:** Actualizar los datos del contacto.
2. **Gestión de Intereses:** Registrar interés (vincular) o quitar interés (desvincular) de una propiedad.
3. **Gestión de Notas:** Crear o editar alguna nota (interacción) en su perfil.
4. **Gestión de Tareas:** Crear, editar o marcar como completada alguna tarea asociada al contacto.
5. **Transacciones:** Cualquier transacción o cierre con alguna propiedad.
6. **Estados y Etapas:** Cambiar la etapa del embudo de ventas o revertir su estado.
7. **Fusión:** Fusionar el contacto con otro existente (Merge).
8. **Colaboración:** Compartir el contacto con otro agente o revocar el acceso compartido.
9. **Mensajería Omnicanal:** Recibir o enviar mensajes a través de WhatsApp o Facebook Messenger.
10. **Gestión de IA:** Modificar el estado del bot de IA (activar/desactivar) o tomar el control manual (Bot Override).
11. **Archivado manual:** Archivar o desarchivar al contacto manualmente.

## Propiedades

1. **Edición General:** Actualizar los datos descriptivos o precio de la propiedad.
2. **Estados y Transacciones:** Cambiar el estado, cerrar una transacción con un contacto, volver a listar o archivar la propiedad.
3. **Gestión de FAQs:** Crear, editar, aprobar, rechazar, reactivar o desactivar una pregunta frecuente.
4. **Gestión de Secciones (Multimedia):** Crear, editar descripción, reordenar o eliminar una sección multimedia.
5. **Galería de Imágenes:** Subir imágenes nuevas, eliminar imágenes, limpiar la galería o establecer una nueva imagen principal.
6. **Gestión de Tareas:** Crear, editar o marcar como completada alguna tarea asociada a la propiedad.