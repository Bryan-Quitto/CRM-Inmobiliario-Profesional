# Spec: 004-Analitica-KPIs (Ventas y Reportes Avanzados)

## 1. Visión General
El Módulo de Analítica y Reportes Avanzados proporciona al Agente Inmobiliario una visión estratégica de su rendimiento comercial. Transforma los datos operativos (Leads, Propiedades, Interacciones, Tareas) en indicadores clave de rendimiento (KPIs) para la toma de decisiones informada.

**Objetivo:** Proporcionar visualizaciones claras sobre la salud del embudo de ventas, proyecciones financieras y eficiencia en el cierre de negocios, priorizando las métricas de actividad y conversión directa.

## 2. Métricas Prioritarias (Backend)

Estas métricas son las principales del módulo y se calculan con base en la actividad semanal/mensual del agente.

### A. Visitas Completadas
- **Fórmula:** Conteo de tareas (`TaskItem`) de tipo "Visita" o "Cita" con `Estado == "Completado"`.
- **Lógica:** Solo cuentan las tareas efectivamente finalizadas. Se ignoran tareas vencidas, canceladas o en estado "Pendiente".
- **Agrupación:** Semanal y Mensual.

### B. Cierres Realizados
- **Fórmula:** Conteo de leads que han pasado a la etapa "Cerrado" o propiedades marcadas como "Vendida"/"Arrendada".
- **Lógica:** Mide el éxito final de las operaciones.
- **Agrupación:** Semanal y Mensual.

### C. Ofertas Generadas
- **Fórmula:** Conteo de leads que se encuentran en la etapa "En Negociación".
- **Lógica:** Representa el volumen de negocio en fase crítica de decisión.
- **Agrupación:** Semanal y Mensual.

### D. Prospectos con Seguimiento Requerido (Total)
- **Fórmula:** Conteo único de Leads que tienen al menos un registro en `LeadPropertyInterest` con nivel de interés "Medio" o "Alto".
- **Lógica:** 
  - Si un prospecto tiene 1 interés "Medio" y 10 "Bajos", **SÍ CUENTA**.
  - Si un prospecto solo tiene intereses "Bajos" o "Descartados", **NO CUENTA**.
- **Agrupación:** Valor total acumulado (no temporal).

### E. Captaciones Propias
- **Fórmula:** Conteo de propiedades captadas directamente por el agente.
- **Nota Técnica:** Esta métrica se implementará una vez se defina el campo de marcado en la entidad `Property` que identifique captaciones propias vs. externas.
- **Agrupación:** Semanal y Mensual.

## 3. Métricas Secundarias (Proyecciones y Eficiencia)

### F. Proyección de Ingresos (Revenue Projection)
- **Fórmula:** `SUM(PrecioPropiedad * ComisionConfigurable)`
- **Lógica:** Suma del precio de propiedades en negociación multiplicada por una comisión que debe ser configurable por el usuario al momento del cierre.
- **Nota:** Se descarta el estándar fijo del 3% en favor de una entrada de datos dinámica.

### G. Tasa de Conversión (Conversion Rate)
- **Fórmula:** `(Total Leads "Cerrado" / Total Leads en el Periodo) * 100`.

### H. Tiempo Promedio de Cierre (Avg. Time to Close)
- **Fórmula:** `AVG(FechaCierre - FechaCreacion)`. Requiere campo `FechaCierre` en `Lead`.

## 4. API Endpoints (Vertical Slice)

### GET `/api/analitica/actividad?inicio=...&fin=...`
- **Respuesta:** Incluye Visitas, Cierres, Ofertas y Captaciones agrupadas por tiempo.
- **Scoping:** Filtrado estricto por `AgenteId` del token JWT.

### GET `/api/analitica/seguimiento`
- **Respuesta:** Total de prospectos con interés Medio/Alto.

## 5. Estrategia de Base de Datos
- **Visitas:** Consulta sobre `TaskItem` filtrando por `AgenteId`, `Estado == "Completado"` y el rango de fechas.
- **Seguimiento:** Consulta `Leads` con `Any` sobre `PropertyInterests` donde `NivelInteres` sea >= 2 (Medio) o >= 3 (Alto).
- **Eficiencia:** Uso de LINQ con proyecciones para evitar carga de objetos pesados en memoria.

## 6. Interfaz de Usuario (Frontend)

### Componente: `AnaliticaView.tsx`
- **Header:** Selector de rango de fechas (Semana/Mes/Personalizado).
- **Cards Principales:** 5 tarjetas destacadas con las métricas prioritarias (Visitas, Cierres, Ofertas, Seguimiento, Captaciones).
- **Gráficos (Recharts):**
  - **LineChart:** Tendencia de cierres y visitas.
  - **PieChart:** Distribución de prospectos por nivel de interés.
  - **BarChart:** Comparativa de captaciones propias vs periodo anterior.

## 7. Próximos Pasos (Tareas Técnicas)
1. Definir campo `NivelInteres` (Enum o Int) en `LeadPropertyInterest` si no existe con esos valores.
2. Añadir campo `FechaCierre` a `Lead`.
3. Implementar lógica de filtrado de intereses (Any Medio/Alto) en el Backend.
4. Desarrollar la UI con enfoque "Zero Wait" (Cache SWR).