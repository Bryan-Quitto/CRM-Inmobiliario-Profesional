# Manual de Analítica y Dashboard

## 1. Arquitectura de Alto Rendimiento (The One Trip Pattern)
Para garantizar tiempos de carga instantáneos en la interfaz, el sistema calcula todas las métricas del tablero principal (Dashboard) y Analítica usando el **"One Trip Pattern"**. Todas las agrupaciones, conteos y proyecciones se realizan directamente en la base de datos a través de una única consulta, minimizando la latencia.
"Tu panel de control es súper rápido. Obtiene todos tus datos y estadísticas en un abrir y cerrar de ojos, sin hacerte esperar."

## 2. Métricas y KPIs del Dashboard Principal
El Dashboard muestra un resumen en tiempo real del estado del agente:
- **Propiedades Disponibles:** Cuenta exclusivamente las propiedades cuyo estado comercial es "Disponible".
  "Aquí verás rápidamente cuántas propiedades tienes actualmente listas para ofrecer."
- **Contactos Activos:** Son todos aquellos clientes que **no** han sido marcados como "Perdido" ni como "Cerrado".
  "Este número te muestra a los clientes con los que estás trabajando actualmente para cerrar un negocio, se filtra en base a los clientes que NO esten marcados como 'Perdido', o 'Cerrado'"
- **Tareas Hoy y Vencidas:** Contabiliza las tareas con estado "Pendiente" cuya fecha máxima de inicio corresponde al límite del día en curso y las tareas vencidas.
  "Tu lista diaria: te recuerda exactamente qué actividades tienes que terminar antes de que acabe el día y aquellas que han vencido."
- **Seguimiento Requerido:** Identifica contactos de alta prioridad basándose en dos reglas:
  1. Su estado **no** debe ser "En Negociación", "Cerrado" ni "Perdido".
  2. Deben tener un interés en propiedades registrado con un nivel "Medio" o "Alto".
  "Esta sección te avisa qué clientes muestran mucho interés pero aún no están negociando, para que no pierdas ninguna oportunidad de venta. Se basa en dos criterios:
  1. Su estado **no** debe ser "En Negociación", "Cerrado" ni "Perdido".
  2. Deben tener un interés en propiedades registrado con un nivel "Medio" o "Alto"."

## 3. Analítica Mensual y Tendencias (Actividad Comercial)
El módulo de analítica contabiliza el rendimiento del agente en un rango de fechas:
- **Visitas Completadas:** Solo se cuentan tareas cuyo tipo sea "Visita" y cuyo estado esté marcado como "Completada" en el rango consultado.
  "Aquí podrás medir cuántos recorridos con clientes lograste completar con éxito en el mes. El criterio para esto son las tareas cuyo tipo sea 'Visita' y hayan sido marcadas como completadas"
- **Cierres Realizados:** Toma en cuenta transacciones formalizadas ("Sale" o "Rent") que no estén canceladas, o aquellos contactos cuya etapa se movió a "Cerrado" o "Ganado".
  "Tu número de éxito: te muestra cuántas ventas o alquileres lograste concretar definitivamente, contabilizando por aquellos clientes en estado "Cerrado"."
- **Ofertas Generadas:** Cuenta cuántas veces un prospecto fue movido a la etapa de "En Negociación".
  "Mide cuántos de tus clientes pasaron de solo preguntar a hacer una oferta real por una propiedad, contabilizando por aquellos clientes en estado "En Negociación"."
- **Captaciones Propias:** Contabiliza las propiedades registradas en ese mes que tengan la bandera `EsCaptacionPropia` en verdadero (no exclusivas de otra inmobiliaria o consorcio).
  "Te dice cuántas propiedades nuevas trajiste a la inmobiliaria por tu cuenta."
- **Línea de Tiempo (Tendencia Semanal):** Los reportes cruzan todos estos datos para dibujar líneas de tendencia día a día (Visitas vs Cierres vs Captaciones).
  "Un gráfico visual que te ayuda a entender qué días de la semana fuiste más productivo y lograste mejores resultados en base a: Visitas vs Cierres vs Captaciones."

## 4. KpiWarmingBackgroundService (Cálculo Proactivo)
- **Actualización Proactiva (Warming):** Cada vez que un agente realiza una acción (crear tarea, actualizar prospecto, etc.), se activa un proceso en segundo plano que recalcula sus KPIs de manera invisible.
  "Cada vez que trabajas en el sistema, tus estadísticas se actualizan solas y en silencio para estar siempre listas cuando las necesites."
- **Anti-Saturación (Debounce):** Si el agente realiza 10 acciones rápidas, el sistema espera 2 segundos (`DebounceMs = 2000`) para agrupar todas las peticiones y calcular los datos una sola vez.
  "El sistema es inteligente y se toma unos segundos para procesar todos tus cambios rápidos a la vez, garantizando que nunca se congele."
- **Zona Horaria:** Todos los límites de días, inicios de mes y cierres, se ajustan forzosamente usando el Offset UTC-5 (Ecuador) para que las métricas reflejen correctamente las operaciones locales.
  "Tus reportes y metas de mes siempre cerrarán en el horario y fecha de Ecuador, sin confundirse con otros horarios."