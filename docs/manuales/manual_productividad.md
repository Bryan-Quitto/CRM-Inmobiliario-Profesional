# Manual de Productividad y Organización

## 1. Gestión de Tareas
El módulo de tareas permite a los agentes inmobiliarios organizar su día a día registrando actividades vinculadas a su gestión comercial.

### Tipos de Tareas
El sistema categoriza las tareas en 4 tipos principales, los cuales tienen identidad visual propia en la plataforma:
- **Llamada** (Color predeterminado azul)
- **Visita** (Color predeterminado esmeralda)
- **Reunión** (Color predeterminado morado)
- **Trámite** (Color predeterminado ámbar)

### Estados de Tarea
Cada tarea atraviesa un ciclo de vida con estados definidos:
- **Pendiente**: Tarea por realizar.
- **Completada**: Tarea finalizada exitosamente.
- **Cancelada**: Tarea que no se llevó a cabo.

### Reglas de Negocio de Creación y Actualización
- **Vinculación:** Una tarea puede crearse libremente, o vincularse a un **Contacto** (cliente/lead) y/o a una **Propiedad**.
- **Validación de Propiedad (Seguridad):** Al asociar una tarea a un contacto o propiedad, el sistema valida estrictamente que el agente sea el dueño o responsable de dicho contacto o propiedad, previniendo accesos indebidos.
- **Duración por Defecto:** Si no se especifica explícitamente, el sistema asigna una duración estándar de 30 minutos a las nuevas tareas para optimizar el registro rápido.
- **Auditoría e Historial (Actividades):** Cuando se crea, actualiza o completa una tarea vinculada, el sistema actualiza automáticamente la fecha de última actividad del Contacto (`UpsertAgentContactActivityAsync`) y de la Propiedad (`UpsertAgentPropertyActivityAsync`) para mantener fresco el seguimiento comercial.
- **Notificación en Tiempo Real:** Las modificaciones a las tareas desencadenan invalidaciones de caché en el tablero principal (`dashboard-data` y `analytics-data`) y notifican proactivamente (`warmingService.NotifyChange`) para que las métricas reflejen inmediatamente los cambios.

## 2. Calendario
El calendario proporciona una vista unificada y temporal de todas las tareas.
- **Zonas Horarias:** Para evitar desfases, el sistema normaliza todas las consultas de calendario utilizando explícitamente la zona horaria UTC-5 (Ecuador/Colombia/Perú).
- Las vistas semanales o mensuales listan todas las tareas (incluyendo el estado y colores personalizados) y permiten reprogramar los eventos arrastrándolos de una fecha a otra, respetando siempre las reglas de validación de propiedad.
