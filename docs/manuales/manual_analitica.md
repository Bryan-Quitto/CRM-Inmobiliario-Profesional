# Manual de Analítica y Dashboard

## 1. Arquitectura de Alto Rendimiento (The One Trip Pattern)
Para garantizar tiempos de carga instantáneos en la interfaz, el sistema calcula todas las métricas del tablero principal (Dashboard) y Analítica usando el **"One Trip Pattern"**. Todas las agrupaciones, conteos y proyecciones se realizan directamente en la base de datos a través de una única consulta, minimizando la latencia.

## 2. Métricas y KPIs del Dashboard Principal
El Dashboard muestra un resumen en tiempo real del estado del agente:
- **Propiedades Disponibles:** Cuenta exclusivamente las propiedades cuyo estado comercial es "Disponible".
- **Contactos Activos:** Son todos aquellos prospectos/clientes que **no** han sido marcados como "Perdido" ni como "Cerrado".
- **Tareas Pendientes Hoy:** Contabiliza únicamente las tareas con estado "Pendiente" cuya fecha máxima de inicio corresponde al límite del día en curso.
- **Seguimiento Requerido:** Identifica contactos de alta prioridad basándose en dos reglas:
  1. Su etapa de embudo **no** debe ser "En Negociación", "Cerrado" ni "Perdido".
  2. Deben tener un interés en propiedades registrado con un nivel "Medio" o "Alto".

## 3. Analítica Mensual y Tendencias (Actividad Comercial)
El módulo de analítica contabiliza el rendimiento del agente en un rango de fechas:
- **Visitas Completadas:** Solo se cuentan tareas cuyo tipo sea "Visita" o "Cita" y cuyo estado esté marcado como "Completada" en el rango consultado. *(Nota aclaratoria: En los formularios del frontend, el agente solo puede crear tareas de tipo "Visita". Sin embargo, el sistema contabiliza "Cita" porque a nivel de backend y automatizaciones de IA/cambio de etapa, el sistema puede generar registros históricos o automáticos bajo este alias).*
- **Cierres Realizados:** Toma en cuenta transacciones formalizadas ("Sale" o "Rent") que no estén canceladas, o aquellos contactos cuya etapa se movió a "Cerrado" o "Ganado".
- **Ofertas Generadas:** Cuenta cuántas veces un prospecto fue movido a la etapa de "En Negociación".
- **Captaciones Propias:** Contabiliza las propiedades registradas en ese mes que tengan la bandera `EsCaptacionPropia` en verdadero (no exclusivas de otra inmobiliaria o consorcio).
- **Línea de Tiempo (Tendencia Semanal):** Los reportes cruzan todos estos datos para dibujar líneas de tendencia día a día (Visitas vs Cierres vs Captaciones).

## 4. KpiWarmingBackgroundService (Cálculo Proactivo)
- **Actualización Proactiva (Warming):** Cada vez que un agente realiza una acción (crear tarea, actualizar prospecto, etc.), se activa un proceso en segundo plano que recalcula sus KPIs de manera invisible.
- **Anti-Saturación (Debounce):** Si el agente realiza 10 acciones rápidas, el sistema espera 2 segundos (`DebounceMs = 2000`) para agrupar todas las peticiones y calcular los datos una sola vez.
- **Zona Horaria:** Todos los límites de días, inicios de mes y cierres, se ajustan forzosamente usando el Offset UTC-5 (Ecuador) para que las métricas reflejen correctamente las operaciones locales.
