# Registro de Refactorización Modular

Este archivo sirve para trackear los archivos monolíticos que superan los umbrales de complejidad y requieren una refactorización bajo los estándares de **Feature-Sliced Design (Frontend)** y **Vertical Slice (Backend)** para optimizar el contexto de la IA y la mantenibilidad.

## Umbrales de Complejidad
- **Frontend:** > 250 líneas en componentes o hooks.
- **Backend:** > 200 líneas en un solo archivo de feature.

---

## 🚀 Pendientes de Refactorización

### Módulo de Propiedades (Crítico)
- [ ] `CRM_Inmobiliario.Api/Features/Propiedades/ImportarDeUrlRemax.cs` (~204 líneas)

### Auth & Seguridad
- [ ] `CRM_Inmobiliario_Web/src/features/auth/components/ConfirmarInvitacion.tsx` (~252 líneas)

### Infraestructura & Background
- [ ] `CRM_Inmobiliario.Api/Features/Dashboard/KpiWarmingBackgroundService.cs` (~202 líneas)

---

## ✅ Refactorizaciones Completadas
*(Mover aquí los archivos una vez finalizados)*

- [x] `CRM_Inmobiliario.Api/Infrastructure/Persistence/CrmDbContext.cs` (Modularizado con IEntityTypeConfiguration por cada entidad)
- [x] `CRM_Inmobiliario.Api/Infrastructure/Pdf/PropiedadFichaDocument.cs` (Modularizado con IComponent: Header, Content, Gallery, Footer)
- [x] `CRM_Inmobiliario.Api/Features/WhatsApp/Services/WhatsAppPromptBuilder.cs` (Modularizado con SystemPromptFactory, AiToolDefinitions y ChatSerializer)
- [x] `CRM_Inmobiliario.Api/Features/Propiedades/CambiarEstadoPropiedad.cs` (Modularizado con Validator y Processor independientes)
- [x] `CRM_Inmobiliario_Web/src/features/tareas/utils/parseComando.ts` (Modularizado en carpeta `parseComando/` con tipos, constantes y extractores)
- [x] `CRM_Inmobiliario_Web/src/App.tsx` (Reducido de ~347 a ~130 líneas. Layout extraído a `Sidebar`, `Header`, `Footer` y `Loaders`)
- [x] `CRM_Inmobiliario.Api/Features/WhatsApp/WhatsAppAiService.cs` (Modularizado con ConversationManager y MessageSender)
- [x] `CRM_Inmobiliario.Api/Features/WhatsApp/Services/WhatsAppToolExecutor.cs` (Modularizado con Patrón Strategy & Handlers)
- [x] `CRM_Inmobiliario.Api/Features/Analitica/ObtenerActividad.cs` (Dividido en `ObtenerActividad.cs` y `ObtenerVentasMensuales.cs` + `AnalyticsDateHelper.cs`)
- [x] `CRM_Inmobiliario_Web/src/features/dashboard/components/DashboardPrincipal.tsx` (Reducido de ~299 a ~60 líneas) - **FSD & Modularizado**
- [x] `CRM_Inmobiliario_Web/src/features/propiedades/components/ClosingModal.tsx` (Reducido de ~307 a ~170 líneas) - **FSD & useClosingModal hook**
- [x] `CRM_Inmobiliario_Web/src/features/propiedades/components/CrearPropiedadForm.tsx` (Reducido de ~301 a ~105 líneas) - **FSD & useCrearPropiedad hook**
- [x] `CRM_Inmobiliario_Web/src/features/clientes/components/CrearClienteForm.tsx` (Reducido de ~367 a ~60 líneas) - **FSD & Hook modular**
- [x] `CRM_Inmobiliario_Web/src/features/clientes/hooks/useClienteDetalle.ts` (~359 líneas) - **Modularizado en 4 sub-hooks**
- [x] `CRM_Inmobiliario_Web/src/features/propiedades/components/PropiedadDetalle.tsx` (Reducido de ~1333 a ~143 líneas)
- [x] `CRM_Inmobiliario_Web/src/features/propiedades/hooks/usePropiedadDetalle.ts` (Dividido en sub-hooks especializados)
- [x] `CRM_Inmobiliario_Web/src/features/calendario/components/CalendarioView.tsx` (Modularizado)
- [x] `CRM_Inmobiliario_Web/src/features/tareas/components/CrearTareaForm.tsx` (FSD)
- [x] `CRM_Inmobiliario_Web/src/features/tareas/components/EditarTareaForm.tsx` (FSD)
- [x] `CRM_Inmobiliario_Web/src/features/clientes/components/ClientesList.tsx` (FSD)
- [x] `CRM_Inmobiliario_Web/src/features/auth/components/ConfiguracionPerfil.tsx` (FSD)
- [x] `CRM_Inmobiliario.Api/Features/WhatsApp/WhatsAppAiService.cs` (Refactor inicial realizado, pero aún extensible)
