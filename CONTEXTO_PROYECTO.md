# Contexto del Proyecto: CRM Inmobiliario Profesional

## Descripción General
Este proyecto es un **CRM (Customer Relationship Management) especializado para el sector inmobiliario profesional**. Su propósito es ayudar a agentes y agencias inmobiliarias a gestionar de forma centralizada y eficiente todo su embudo de ventas, propiedades, clientes, citas y analíticas.

Está diseñado enfocado en **velocidad extrema (Zero Wait Policy)**, ofreciendo a los usuarios una experiencia premium sin bloqueos mediante interfaces reactivas optimistas, actualizaciones instantáneas (flicker-free) y persistencia en caché robusta.

Todos los agentes IA que interactúen con el proyecto **deben leer el archivo `SKILLS.md`** primero, ya que allí se establecen los estándares de rendimiento, arquitectura (Vertical Slice) y manejo de husos horarios.

## Stack Tecnológico (Core)
- **Backend:** .NET 10 (C#) con Entity Framework Core. Arquitectura **Vertical Slice** (estrictamente prohibido Clean Architecture o MVC clásico).
- **Frontend:** React 19 (Vite) con TypeScript. Arquitectura orientada a **Feature-Sliced Design**.
- **Estilos:** Tailwind CSS (Uso estricto de clases de utilidad, sin estilos en línea).
- **Base de Datos & Autenticación:** Supabase (PostgreSQL + JWT Auth).
- **Manejo de Datos Frontend:** Uso intensivo de `SWR` con patrón `localStorageProvider` y configuración de `keepPreviousData` para la sensación de latencia cero y persistencia local.

## Estándares Clave (Resumen Rápido)
1. **Husos Horarios (Ecuador UTC-5):** Toda lógica de fechas opera y calcula estrictamente bajo el huso horario de Ecuador (UTC-5), sin importar dónde esté alojado el servidor o base de datos.
2. **The One Trip Pattern:** En endpoints pesados de lectura (Analítica, Datatables, Dashboards), la regla prohíbe realizar múltiples consultas con `await` a la base de datos en secuencia. Todo debe consolidarse en una sola proyección LINQ (`.Select(...)`) hacia la DB.
3. **Optimistic UI y UX:** Las interacciones del usuario (borrados, asignaciones temporales, marcación de estados) deben reflejarse visualmente en la interfaz en menos de 100ms. Se apoya del "Undo Pattern" para reversión antes del impacto remoto.
4. **Almacenamiento de Archivos:** Totalmente prohibido incrustar base64 en la base de datos. Se utiliza almacenamiento de objetos, persistiendo únicamente la URL.

## Funcionalidades Actuales (Features)
_Nota: Esta sección se actualizará conforme avance el desarrollo del proyecto._

- **Autenticación y Seguridad (`auth`):** Inicio de sesión, registro (posiblemente B2B) y manejo de tokens integrados a Supabase.
- **Dashboard Principal (`dashboard`):** Vista panorámica de KPIs e indicadores rápidos de gestión del asesor inmobiliario.
- **Analítica de Negocios (`analitica`):** Reportes y estadísticas detalladas sobre cierres, rendimiento, conversión y estado del portafolio.
- **Gestión de Propiedades (`propiedades`):** ABM (Alta, Baja, Modificación) del inventario inmobiliario, categorías, estados transaccionales (Alquiler, Venta, Reservado) e información financiera clave.
- **Clientes y Contactos (`clientes`):** Listado y gestión de perfiles de clientes, tanto vendedores como compradores/arrendatarios, con un historial sólido.
  - *Módulo ClienteDetalle:* Implementa la política Zero-Wait para vinculación, edición y eliminación de Inmuebles de Interés utilizando "Optimistic UI" para que los elementos reaccionen instantáneamente (0ms) en la pantalla.
  - *Búsqueda Difusa Integrada:* Selección de propiedades motorizada por `fuse.js` alimentado por el estado base general de SWR para una experiencia nativa sin demoras de red.
- **Gestión de Tareas (`tareas`):** Agenda de pendientes o "to-dos" que permiten al asesor estar al día sobre seguimientos.
- **Calendario / Citas (`calendario`):** Componente organizacional para mapear visitas técnicas y demostraciones de propiedades.
- **Configuración de la Cuenta (`configuracion`):** Ajustes globales o personales de cada agente/agencia.

## Directorios Principales
- **Backend (API):** `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario.Api`
- **Frontend (Web):** `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web`

---

_Nota para Agentes IA en futuras sesiones: En este repositorio se aplica el **Spec-Driven Development (SDD)**. Cada vez que se aborde crear un nuevo módulo, entidad de base de datos o arquitectura compleja, está **normado** generar y revisar primero un `spec.md` con las propuestas. En cambio, para cambios menores o fixes de bugs, se ejecutará el código de forma quirúrgica sin crear esquemas formales._