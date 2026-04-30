# Registro de Refactorización Modular

Este archivo sirve para trackear los archivos monolíticos que superan los umbrales de complejidad y requieren una refactorización bajo los estándares de **Feature-Sliced Design (Frontend)** y **Vertical Slice (Backend)** para optimizar el contexto de la IA y la mantenibilidad.

## Umbrales de Complejidad
- **Frontend:** > 250 líneas en componentes o hooks.
- **Backend:** > 200 líneas en un solo archivo de feature.

---

## 🚀 Pendientes de Refactorización

### Módulo de Clientes

### Módulo de Propiedades
- [ ] `CRM_Inmobiliario_Web/src/features/propiedades/context/UploadProvider.tsx` (~330 líneas)
- [ ] `CRM_Inmobiliario_Web/src/features/propiedades/components/ClosingModal.tsx` (~307 líneas)
- [ ] `CRM_Inmobiliario_Web/src/features/propiedades/hooks/usePropiedadGallery.ts` (~295 líneas)

### Módulo de Dashboard y Analítica
- [ ] `CRM_Inmobiliario_Web/src/features/dashboard/components/DashboardPrincipal.tsx` (~299 líneas)
- [ ] `CRM_Inmobiliario.Api/Features/Analitica/ObtenerActividad.cs` (~268 líneas)

### Módulo de WhatsApp / IA (Backend)
- [ ] `CRM_Inmobiliario.Api/Features/WhatsApp/Services/WhatsAppToolExecutor.cs` (~271 líneas)
- [ ] `CRM_Inmobiliario.Api/Features/WhatsApp/WhatsAppAiService.cs` (~214 líneas)

### Otros (Utilidades Complejas)
- [ ] `CRM_Inmobiliario_Web/src/features/tareas/utils/parseComando.ts` (~288 líneas)

---

## ✅ Refactorizaciones Completadas
*(Mover aquí los archivos una vez finalizados)*

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