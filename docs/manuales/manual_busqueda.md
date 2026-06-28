# Manual de Búsqueda y Herramientas Transversales

Este documento detalla las reglas de negocio, lógicas de validación y parametrizaciones del grupo de Búsqueda y Herramientas Transversales del CRM Inmobiliario Profesional.

## 1. OmniSearch (Búsqueda Omnicanal)
El sistema dispone de un buscador unificado transversal que permite a los agentes localizar distintos tipos de registros desde un único punto de entrada.
- **Backend OmniSearch:** El módulo `Shared / OmniSearch` expone un endpoint central que distribuye la consulta del usuario hacia diferentes entidades del sistema (propiedades, contactos, tareas, FAQs).
- **Frontend UI:** En `src/features/omnisearch`, el frontend implementa los componentes visuales (Command Palette) de la barra de búsqueda universal y los hooks para integrar sugerencias y resultados instantáneos conforme el usuario tipea. Cabe destacar que, a nivel frontend, los resultados dinámicos presentados al usuario se limitan a Contactos, Propiedades y Tareas, junto con diversas opciones de navegación rápida estáticas (no se muestran FAQs en este buscador).

## 2. Configuraciones Transversales y Compartidas
- **Settings:** El módulo compartido (`Shared / Settings`) aloja las lógicas de configuración globales que aplican transversalmente a diversos dominios de la aplicación, garantizando consistencia en toda la plataforma.

## 3. Parametrizaciones Técnicas
Las herramientas de búsqueda se apoyan en los procesos asíncronos de vectorización definidos en los módulos de administración y conocimiento corporativo, posibilitando tanto búsquedas por palabra clave estándar como consultas semánticas basadas en IA.
