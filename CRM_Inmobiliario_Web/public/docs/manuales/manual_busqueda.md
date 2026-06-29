# Manual de Búsqueda y Herramientas Transversales

Este documento detalla las reglas de negocio, lógicas de validación y parametrizaciones del grupo de Búsqueda y Herramientas Transversales del CRM Inmobiliario Profesional.

## 1. OmniSearch (Búsqueda Omnicanal)
El sistema dispone de un buscador unificado transversal que permite a los agentes localizar distintos tipos de registros desde un único punto de entrada.
- **OmniSearch:** El módulo `Shared / OmniSearch` expone un endpoint central que distribuye la consulta del usuario hacia diferentes entidades del sistema (propiedades, contactos, tareas, FAQs).
"Contamos con un buscador global inteligente que busca al mismo tiempo en todas tus propiedades, clientes, tareas y base de conocimiento con una sola consulta. Puedes utilizarlo rapidamente con 'Control + K', y cerrarlo con la tecla de 'Escape' de tu computador.

Dentro de sus funciones están:

1. Accesos rápidos: Te permite dirigirte a alguna parte del sistema (Crear tarea, Calendario, Configuración del Perfil, Contactos, Propiedades, etc.)

2. Contactos: Te permite dirigirte a los detalles de un contacto en específico, permite la búsqueda con el nombre, apellido, o número de telefono del contacto

3. Propiedades: Te permite dirigirte a los detalles de una propiedad en específico, permite la búsqueda con el título de la propiedad, ciudad, o sector"