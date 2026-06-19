# Plan de Implementación: Auditoría General de IA (ia-general-audit-logs)

Este plan describe la arquitectura y los pasos para implementar la vista "General" de auditoría de IA, consolidando eventos críticos (`AiActionLog`) y sesiones dinámicas de mensajes agrupados por inactividad.

## 🎯 Objetivo
Proporcionar a los administradores una vista macro de las decisiones y conversaciones de la IA sin inundarlos de ruido, agrupando interacciones de chat en "sesiones" lógicas y resaltando eventos críticos (escalamientos, captaciones, etc.).

## 🧠 Decisiones de Diseño (Post-Feedback)

**1. Rendimiento y Agrupación (Zero-Wait Policy):**
Se ha decidido utilizar la **Agrupación Dinámica al vuelo (SQL Window Functions)**. Dado que la escritura de mensajes nuevos es el camino crítico de la IA, intentar mantener una tabla física `ConversacionSession` requeriría bloqueos (locks) transaccionales que podrían ralentizar la ingesta de mensajes. La agrupación dinámica evita tocar el camino de escritura. Al restringir las búsquedas a un máximo de 31 días (ver punto 2) y usar el `OutputCache` de .NET (caché en memoria), el endpoint de lectura responderá en milisegundos, garantizando el Zero-Wait.

**2. Paginación y Filtros de Fecha:**
Se implementará un filtro con las opciones: **Hoy, Semana, Mes, Personalizada**. La opción Personalizada permitirá un rango máximo de 31 días (con un Tooltip explicativo). Esta restricción de tiempo es el "escudo" perfecto que garantiza que el query de Window Functions en SQL sea extremadamente rápido y no degrade la base de datos a futuro.

## 🚀 Propuesta Técnica

### Backend (Vertical Slice)

#### [NEW] `CRM_Inmobiliario.Api/Features/IaLogs/ObtenerAuditoriaGeneral.cs`
Crearemos un nuevo feature endpoint que realizará lo siguiente:
1.  **Consulta SQL Bruta (Dapper o EF Core SQL Query):** Consultará la tabla de Mensajes y aplicará la función `LAG(FechaCreacion)` particionada por `ContactoId` o `AgenteId`.
2.  **Lógica de Agrupación:** Si la diferencia entre un mensaje y su predecesor es > 10 minutos, marca el inicio de una nueva "Sesión". Retornará un objeto consolidado: `FechaInicio`, `FechaFin`, `ContactoId` (o `AgenteId`), `PrimerMensajeId`.
3.  **Combinación de Eventos:** Consultará la tabla `AiActionLog` filtrando por eventos "Críticos" (o todos si el toggle informativo está activo).
4.  **Consolidación:** Unirá ambas listas (Sesiones + Acciones), las ordenará cronológicamente de forma descendente y las devolverá en una lista polimórfica o con un DTO envolvente: `AuditoriaGeneralItemDto`.

#### [MODIFY] `CRM_Inmobiliario.Api/Features/IaLogs/IaLogsEndpoints.cs` (o equivalente)
Se registrará la ruta `GET /api/ia/logs/general`.

### Frontend (React / Vite)

#### [NEW] `CRM_Inmobiliario_Web/src/features/ia/api/getAuditoriaGeneral.ts`
Fetcher para consumir el endpoint consolidado.

#### [NEW] `CRM_Inmobiliario_Web/src/features/ia/hooks/useAuditoriaGeneral.ts`
Hook para gestionar el estado, la paginación y el *toggle* de eventos informativos. Implementará `keepPreviousData: true` (Zero-Wait policy).

#### [NEW] `CRM_Inmobiliario_Web/src/features/ia/components/AuditoriaGeneralView.tsx`
Renderizará un Timeline (línea de tiempo) con dos tipos de tarjetas:
*   **Tarjeta de Sesión:** Muestra "Conversación con contacto [Nombre] (10:00 - 10:15)". Botón para abrir `/contactos/:id?tab=whatsapp&msgId=X` en una nueva pestaña.
*   **Tarjeta de Evento Crítico:** Muestra "🚨 Alerta de Escalamiento", motivo y un botón primario "Ir a la Tarea".

#### [MODIFY] `CRM_Inmobiliario_Web/src/App.tsx`
Remplazar el componente actual (que probablemente redirige o está vacío) por `<AuditoriaGeneralView />` en la ruta `/registros-ia/general`.

## 🧪 Plan de Verificación

### Pruebas Automatizadas (Go/Bash)
- Si aplica, se validará la sintaxis y compilación del backend mediante `dotnet build`.

### Verificación Manual
1.  Crear interacciones espaciadas por 5 min y luego por 15 min en la base de datos de pruebas para validar que la agrupación SQL corte y cree dos sesiones separadas.
2.  Generar un evento crítico (Simular Escalamiento) y verificar que aparezca intercalado correctamente por fecha en el Frontend.
3.  Probar el click en el enlace de la sesión, validando que abra la pestaña correcta y el UI de contactos atrape el `msgId`.
