# Manual de Auto-Archivado

## Descripción de la Configuración

En la pantalla de configuración del auto-archivado, encontrarás las siguientes opciones para automatizar el mantenimiento de tu CRM:

*   **Contactos Inactivos:** Un interruptor (switch) que te permite activar o desactivar el auto-archivado para tus contactos. Al activarlo, podrás ajustar el **Límite de Inactividad**, que es el tiempo (en días) que un contacto debe permanecer sin actividad para ser archivado automáticamente. Puedes configurar este valor entre **100 y 1095 días**.
*   **Propiedades Inactivas:** Un interruptor (switch) que te permite activar o desactivar el auto-archivado para tus propiedades. Al igual que con los contactos, cuenta con un campo de **Límite de Inactividad** que te permite definir un periodo de entre **100 y 1095 días** sin actividad antes de que la propiedad se archive de forma automática.

## Criterio de Archivado (Qué mantiene vivos tus registros)

El sistema está diseñado para ayudarte a mantener limpio tu CRM archivando automáticamente los registros cuando no detecta actividad reciente. Sin embargo, sabemos que muchos registros siguen siendo relevantes, por lo que cualquier interacción o trabajo que realices sobre ellos actualizará su "actividad reciente" y evitará que sean archivados (es decir, los "mantendrá vivos"). 

A continuación, te presentamos el resumen de las acciones que mantienen tus registros activos:

### Acciones que mantienen vivos a los Contactos
1. **Edición General:** Actualizar cualquier dato o información del contacto.
2. **Gestión de Intereses:** Vincular (registrar interés) o desvincular una propiedad del perfil del contacto.
3. **Gestión de Notas:** Crear o editar notas de interacción en su perfil.
4. **Gestión de Tareas:** Crear, editar o marcar como completadas tareas asociadas al contacto.
5. **Transacciones:** Registrar transacciones o cierres relacionados con el contacto y alguna propiedad.
6. **Estados y Etapas:** Modificar la etapa del embudo de ventas o revertir su estado.
7. **Fusión (Merge):** Fusionar el contacto con otro existente en el sistema.
8. **Colaboración:** Compartir el contacto con otro agente o revocar este acceso.
9. **Mensajería Omnicanal:** Enviar o recibir mensajes a través de plataformas como WhatsApp o Facebook Messenger.
10. **Gestión de IA:** Activar/desactivar el bot de Inteligencia Artificial o tomar su control de forma manual (Bot Override).
11. **Control Manual:** Archivar o desarchivar el contacto de manera manual.

### Acciones que mantienen vivas a las Propiedades
1. **Edición General:** Actualizar datos descriptivos, características o cambiar el precio de la propiedad.
2. **Estados y Transacciones:** Modificar el estado de la propiedad, cerrar una transacción, volver a listarla o archivarla.
3. **Gestión de Preguntas Frecuentes (FAQs):** Crear, editar, aprobar, rechazar, reactivar o desactivar las FAQs de la propiedad.
4. **Gestión Multimedia:** Crear secciones, editar su descripción, reordenarlas o eliminarlas.
5. **Galería de Imágenes:** Subir nuevas imágenes, eliminarlas, limpiar toda la galería o cambiar la imagen principal.
6. **Gestión de Tareas:** Crear, editar o marcar como completadas tareas asociadas a la propiedad.

## 3. Consecuencias del Archivado

Cuando un registro pasa a estado "Archivado", este entra en un modo de "solo lectura" para preservar su información histórica intacta. A continuación, te explicamos qué acciones quedan deshabilitadas para cada tipo de registro:

### Para Contactos (Clientes / Propietarios)
Al archivar un contacto, se bloquean las siguientes funciones:
* **Edición de datos:** El botón para editar la información principal del contacto desaparece.
* **Fusión de contactos:** No podrás fusionar el contacto archivado con otro registro.
* **Asistente de Inteligencia Artificial:** El interruptor para activar o desactivar la IA de manera automática se deshabilita, mostrando una advertencia.
* **Gestión de Intereses:** Se bloquea el formulario, por lo que no podrás vincular nuevas propiedades al contacto.
* **Historial e Interacciones:** El editor de notas se oculta, impidiendo la creación de nuevas interacciones en la línea de tiempo.
* **Cambio de estado:** No podrás cambiar la etapa del embudo ni el estado del propietario (el sistema bloqueará la acción y mostrará un mensaje de advertencia).

### Para Propiedades
Cuando una propiedad es archivada, se aplican estas restricciones:
* **Edición de datos:** El botón para editar la información principal de la propiedad se oculta.
* **Exportación y Compartir:** Desaparecen las opciones rápidas para generar el archivo PDF de la propiedad y para compartirla directamente por WhatsApp.
* **Gestión Multimedia (Galería):** Se bloquea por completo la opción de subir o administrar fotos.
* **Base de Conocimiento (Preguntas frecuentes):** Queda inhabilitada la creación, edición, aprobación y eliminación de preguntas frecuentes (FAQ) asociadas a la propiedad.
* **Historial de transacciones:** Se deshabilita la función de añadir o editar notas mediante doble clic en la línea de tiempo.
* **Cambio de estado:** Al igual que con los contactos, no podrás modificar el estado de la propiedad (el sistema te alertará si intentas cambiarlo).
* **Limpieza por Inactividad (Más de 1 año):** Si una propiedad (incluso Disponible o Reservada) pasa 1 año sin actividad, el sistema eliminará sus fotos y PDFs (mostrando una advertencia en rojo previamente, y siendo filtrable bajo "Por limpiar"). Las propiedades Vendidas o Alquiladas sufren esta limpieza 1 año después de la operación de forma inevitable.

> **Nota:** Para recuperar cualquiera de estas funcionalidades y volver a editar el registro, simplemente debes utilizar la opción de "Desarchivar".
