# Spec 026: Refactorización de Arquitectura - Migración a Role-Based Access Control (RBAC)

## 1. Objetivo
Erradicar la deuda técnica del UUID de administrador "quemado" (`d4a6efdd-b801-40fb-901e-64e36f6b1400`) y migrar el sistema de autorización a un modelo basado en roles (RBAC) utilizando Claims de JWT (`app_metadata.role: "Admin"`), tanto en Frontend como en Backend y Base de Datos (RLS).

## 2. Requerimientos
1. **Limpieza del Anti-patrón:** Remover el UUID hardcodeado en todo el código.
2. **Implementación de Políticas (Backend):** Configurar validación de policies (ej. `RequireRole("Admin")`) basada en el claim del JWT de Supabase.
3. **Actualización del Estado (Frontend):** Actualizar hooks y protecciones de rutas (`AdminRoute`, `ConfiguracionLayout`) para validar el claim `role` del JWT o sesión.
4. **Validación de la Base de Datos:** Actualizar cualquier política RLS en Supabase que dependa de este UUID para que en su lugar utilice `jwt() -> 'app_metadata' ->> 'role'`.

## 3. Plan de Acción Detallado

### Fase 1: Backend (.NET 10)
- **`ServiceCollectionExtensions.cs`**: Agregar una política de autorización `AdminPolicy` que verifique si el claim de `role` existe y es `Admin`. (Supabase envía los roles en `app_metadata` por defecto, hay que extraerlo).
- **Controladores / Features de Configuración (`AdminApiKeys.cs`, `DesactivarAgente.cs`, `ListarAgentes.cs`, `ReactivarAgente.cs`, `ListarLogsSeguridad.cs`)**: Reemplazar las validaciones manuales `if (userId != "d4a6efdd...")` por el atributo `[Authorize(Policy = "AdminPolicy")]` o validación del Claim en el request.
- **WhatsApp Handlers (`DerivarCaptacionPropietarioHandler.cs`, `RegistrarNuevoContactoHandler.cs`, `SolicitarAsistenciaHumanaHandler.cs`)**: Reemplazar la asignación o validación quemada. Si se usaba el UUID como fallback, deberá consultarse en la base de datos a un usuario con el rol `Admin`.
- **Filtros (`SecurityTelemetryFilter.cs`)**: Actualizar la telemetría para evaluar permisos por el Claim del JWT y no por el ID quemado.

### Fase 2: Frontend (React 19)
- **Rutas y Layouts (`AdminRoute.tsx`, `ConfiguracionLayout.tsx`)**: Modificar la condición de renderizado para chequear `user?.app_metadata?.role === 'Admin'` en lugar del `user.id === 'd4a...'`.
- **Componentes (`AdminApiKeysPanel.tsx`, `ConfiguracionSeguridad.tsx`, `ListaAgentes.tsx`)**: Ajustar las validaciones internas (ej. Sudo Mode y visibilidad) para usar el nuevo esquema RBAC.
- **Hooks de Auth (SWR / Supabase)**: Asegurar que el objeto de sesión exponga correctamente `app_metadata.role` a través del hook de autenticación principal de la aplicación.

### Fase 3: Base de Datos & RLS (Supabase)
- Crear una nueva migración EF Core (`EnableRBACSecurityPolicies`) que reemplace el RLS obsoleto en tablas como AuditLogs y donde se esté utilizando.
- En la base de datos, funciones como `auth.uid() = 'd4a6efdd...'` se modificarán a `(auth.jwt() -> 'app_metadata' ->> 'role') = 'Admin'`.

## 4. Riesgos y Consideraciones
- **Pérdida temporal de acceso:** El usuario administrador actual perderá acceso a los paneles de configuración si no se le asigna el rol `Admin` en `app_metadata` en Supabase Auth antes del despliegue.
- **Caché de JWT:** Los tokens JWT activos no reflejarán el nuevo Claim hasta que se refresquen en los clientes.

## 5. Criterios de Aceptación
- Ningún archivo `.cs` o `.tsx` debe contener el UUID `d4a6efdd-b801-40fb-901e-64e36f6b1400`.
- El acceso a rutas `/configuracion` y acciones críticas en el frontend es bloqueado si el usuario no tiene el rol Admin en JWT.
- Las API devuelven `403 Forbidden` al intentar ejecutar acciones de administrador sin el Claim.
