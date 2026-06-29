# Manual de Productividad y Organización

## 1. Gestión de Tareas
El módulo de tareas permite a los agentes inmobiliarios organizar su día a día registrando actividades vinculadas a su gestión comercial.

### Tipos de Tareas
El sistema categoriza las tareas en 4 tipos principales, los cuales tienen identidad visual propia en la plataforma:
- **Llamada** (Color predeterminado azul)
  "Para registrar las llamadas telefónicas con tus clientes, fáciles de identificar por su color azul."
- **Visita** (Color predeterminado esmeralda)
  "Para agendar recorridos y muestras de propiedades, destacadas en color esmeralda."
- **Reunión** (Color predeterminado morado)
  "Para tus encuentros presenciales o virtuales, marcadas en color morado."
- **Trámite** (Color predeterminado ámbar)
  "Para el papeleo y gestiones administrativas, señaladas en color ámbar."

### Estados de Tarea
Cada tarea atraviesa un ciclo de vida con estados definidos:
- **Pendiente**: Tarea por realizar.
  "Las actividades que aún tienes pendientes por hacer."
- **Completada**: Tarea finalizada exitosamente.
  "Las tareas que marques como completadas se verán reflejadas en tus estadísticas generales de forma automática, permitiéndote medir tu rendimiento real."
- **Cancelada**: Tarea que no se llevó a cabo.
  "Las actividades que por alguna razón no se pudieron realizar."

### Reglas de Negocio de Creación y Actualización
- **Vinculación:** Una tarea puede crearse libremente, o vincularse a un **Contacto** (cliente/lead) y/o a una **Propiedad**.
  "Puedes crear tareas sueltas o conectarlos directamente con un cliente específico y la propiedad que le interesa."
- **Validación de Propiedad (Seguridad):** Al asociar una tarea a un contacto o propiedad, el sistema valida estrictamente que el agente sea el dueño o responsable de dicho contacto o propiedad, previniendo accesos indebidos.
  "Tus datos están protegidos. Solo tú puedes ver y asignar tareas a los clientes y propiedades que tienes en tu lista."
- **Notificación en Tiempo Real:** Las modificaciones a las tareas desencadenan invalidaciones de caché en el tablero principal (`dashboard-data` y `analytics-data`) y notifican proactivamente (`warmingService.NotifyChange`) para que las métricas reflejen inmediatamente los cambios.
  "Todo cambio que hagas en tus tareas se reflejará al instante en tus estadísticas y tablero principal, sin necesidad de recargar la página"

## 2. Calendario
El calendario proporciona una vista unificada y temporal de todas las tareas.
- **Zonas Horarias:** Para evitar desfases, el sistema normaliza todas las consultas de calendario utilizando explícitamente la zona horaria UTC-5 (Ecuador/Colombia/Perú).
  "Tu calendario siempre estará en hora local. No tienes que preocuparte por cambios de horario, el sistema se ajusta automáticamente."
- Las vistas semanales o mensuales listan todas las tareas (incluyendo el estado y colores personalizados) y permiten reprogramar los eventos arrastrándolos de una fecha a otra, respetando siempre las reglas de validación de propiedad.
  "Organizar tu semana es muy fácil: solo arrastra y suelta tus tareas en el calendario para cambiarles el día o la hora."
