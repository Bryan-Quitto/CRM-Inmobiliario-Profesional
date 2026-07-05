# Reporte de anti-patrones de navegación

Se ha detectado el uso de `onClick` para manejar la navegación en lugar de utilizar etiquetas `<a>` o `<Link>`. Esto impide que los usuarios puedan utilizar las funciones nativas del navegador como "Abrir en una nueva pestaña" (Clic derecho) o "Ctrl+Clic".

## Directorio: Tareas

- Ruta del archivo: C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\features\tareas\components\TareaDetalleDesktop.tsx
- Número de línea y código encontrado: Línea 146, `<button onClick={handleNavigateToClient} ...>`
- Botón en términos de usuario: Botón "Contacto Relacionado" en el detalle de la tarea

- Ruta del archivo: C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\features\tareas\components\TareaDetalleDesktop.tsx
- Número de línea y código encontrado: Línea 164, `<button onClick={handleNavigateToProperty} ...>`
- Botón en términos de usuario: Botón "Inmueble de Interés" en el detalle de la tarea

- Ruta del archivo: C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\features\tareas\components\TareaDetalleMobile.tsx
- Número de línea y código encontrado: Línea 145, `<button onClick={handleNavigateToClient} ...>`
- Botón en términos de usuario: Botón "Contacto Relacionado" en el detalle de la tarea

- Ruta del archivo: C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\features\tareas\components\TareaDetalleMobile.tsx
- Número de línea y código encontrado: Línea 163, `<button onClick={handleNavigateToProperty} ...>`
- Botón en términos de usuario: Botón "Inmueble de Interés" en el detalle de la tarea

## Directorio: Calendario

No se encontraron incidencias que utilicen eventos onClick para navegar mediante rutas.
