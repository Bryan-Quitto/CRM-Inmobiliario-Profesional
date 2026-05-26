# 025 - Security and Telemetry: Anomalous Activity Logs (Manual Theft Detection)

El objetivo de este plan de implementación es mitigar el último vector de ataque viable de "Robo Manual de Cartera": un agente que navega frenéticamente los detalles individuales de propiedades y contactos para copiarlos. Al usar un mecanismo ligero basado en caché en memoria y filtros de endpoints, interceptaremos este comportamiento anómalo sin afectar el rendimiento de la base de datos (One Trip Pattern).

## User Review Required

> [!IMPORTANT]
> - **Umbral de Alerta:** ¿Está de acuerdo con definir el límite inicial en > 20 registros distintos en una ventana de 5 minutos? ¿Debe ser estático por ahora o requiere configuración desde la base de datos?
> - **Acción Post-Detección:** El requerimiento actual indica registrar el incidente (Log) para auditoría. ¿Se requiere aplicar alguna penalización automática (ej. invalidar el JWT del agente o bloquear temporalmente su cuenta) tras la detección?
> - **Caché en Memoria vs Redis:** Para asegurar el patrón "One Trip Pattern", la implementación propuesta utiliza `IMemoryCache` (RAM local del host C#). Asumimos que la API no escala horizontalmente a múltiples réplicas (o que no importa si la cuenta se divide por réplica). Si hay múltiples réplicas, sugeriremos `IDistributedCache` con Redis/Supabase. Por favor, confirme si `IMemoryCache` es suficiente.

## Proposed Changes

### 1. Database & Domain Models (Backend)

#### [NEW] `CRM_Inmobiliario.Api/Infrastructure/Persistence/Entities/SecurityAuditLog.cs`
- Entidad `SecurityAuditLog` mapeando el registro de la anomalía.
- Propiedades: `Id` (Guid, PK), `AgenteId` (Guid, índice), `TipoIncidente` (string, ej. "Posible Robo Manual"), `Descripcion` (string, ej. "Visitó 22 contactos en 4 minutos"), `Timestamp` (DateTimeOffset, configurado a UtcNow + Ecuador offset si aplica).

#### [MODIFY] `CRM_Inmobiliario.Api/Infrastructure/Persistence/CrmDbContext.cs`
- Agregar `DbSet<SecurityAuditLog> SecurityAuditLogs`.
- Configurar entidad mediante Fluent API (nombre de tabla "SecurityAuditLogs", índices correspondientes).

#### [NEW] Supabase Migration y Políticas RLS
- Ejecutar `dotnet ef migrations add AddSecurityAuditLogs`.
- Crear un script SQL auxiliar o inyectar código en la migración de EF para definir el RLS en la tabla nueva.
- Políticas RLS:
  - Solo el administrador principal (`UUID: d4a6efdd-b801-40fb-901e-64e36f6b1400`) y `service_role` pueden ejecutar `SELECT`.
  - Roles autenticados u operaciones internas a través del API pueden ejecutar `INSERT`.

---

### 2. Backend Security & Telemetry Infrastructure

#### [MODIFY] `CRM_Inmobiliario.Api/Program.cs` (o extensiones)
- Añadir servicio de caché: `builder.Services.AddMemoryCache();` si no está registrado.

#### [NEW] `CRM_Inmobiliario.Api/Infrastructure/Security/SecurityTelemetryFilter.cs`
- Creación de un `IEndpointFilter` para Minimal APIs.
- Obtiene el ID del agente a partir del JWT Claims (si existe).
- Obtiene el ID de la entidad (Propiedad o Contacto) a visualizar (desde los argumentos de la ruta).
- Manipula una entrada en `IMemoryCache` con la llave `Telemetry_Views_{AgenteId}`:
  - Estructura: Colección de IDs visitados (`HashSet<Guid>` o similar manejado concurrentemente).
  - Expiración de caché (Absolute Expiration): 5 minutos.
  - Validar tamaño de la colección. Si `count > 20`:
    - Insertar un nuevo log de incidente de robo en `CrmDbContext.SecurityAuditLogs`.
    - Limpiar la caché local para este agente (para que no genere registros duplicados en spam).

#### [MODIFY] Endpoints Críticos (Obtener Detalles)
- `CRM_Inmobiliario.Api/Features/Propiedades/ObtenerPropiedadPorId.cs`
- `CRM_Inmobiliario.Api/Features/Contactos/ObtenerContactoPorId.cs`
- Inyectar al final de la definición de ruta: `.AddEndpointFilter<SecurityTelemetryFilter>()`.

---

### 3. Backend Endpoints (Auditoría de Seguridad)

#### [NEW] `CRM_Inmobiliario.Api/Features/Configuracion/Seguridad/ListarLogsSeguridad.cs`
- Endpoint protegido `GET /configuracion/seguridad/logs`.
- Lógica de Acceso Crítico:
  - Obtener el ID del agente actual de sus Claims.
  - Si `agenteId != d4a6efdd-b801-40fb-901e-64e36f6b1400`, retornar inmediatamente `403 Forbidden`.
- Consulta a `SecurityAuditLogs`, agrupando o mostrando las alertas de los agentes de forma paginada/top descendente por `Timestamp`.

---

### 4. Frontend UI/UX (Centro de Seguridad del Broker)

#### [NEW] `CRM_Inmobiliario_Web/src/features/configuracion/views/AuditoriaSeguridadView.tsx`
- Componente principal en React que aloja la vista de seguridad.
- Control de Acceso Estricto en Frontend: Evaluar el `user.id`. Si no es el admin, renderizar una advertencia o redireccionar utilizando UI amigable.
- Diseño World-Class (Alineado a Inquebrantables): Utilizar componentes visualmente potentes, tablas con glassmorphism o cards limpias (estilo Tailwind/Shadcn), skeletons mientras cargan (Ultra-Premium Sync Pattern).
- Mostrar los datos de los incidentes (Nombre del Agente implicado, Descripción de los accesos masivos, y Fecha/Hora exacta en zona horaria UTC-5).

## Verification Plan

### Automáticas / Manuales
- Realizar pruebas de carga locales o automatizadas accediendo al endpoint `ObtenerPropiedadPorId` 22 veces con un token JWT válido de un usuario de prueba en un lapso de 1 minuto.
- Confirmar que el EF Profiler no reporta accesos adicionales SQL para los primeros 20 accesos (Validando `IMemoryCache` One Trip Pattern).
- Tras el acceso número 21, certificar que se inserta el `SecurityAuditLog`.
- Comprobar que cualquier intento de consultar `/configuracion/seguridad/logs` por alguien ajeno a `d4a6efdd-b801-40fb-901e-64e36f6b1400` produce un 403 Forbidden y la UI lo rechaza elegantemente.
