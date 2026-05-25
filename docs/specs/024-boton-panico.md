# Spec 024 - Botón de Pánico del Broker (Off-boarding 1-Clic)

Este documento detalla el diseño y especificación técnica de la funcionalidad de desactivación y reasignación automática de agentes para proteger la cartera de la agencia.

## 1. Reglas de Negocio Inquebrantables
- **Usuario Administrador Hardcoded**: La funcionalidad estará estrictamente restringida al UUID `d4a6efdd-b801-40fb-901e-64e36f6b1400`. Cualquier otro usuario recibirá un `403 Forbidden` y no verá el botón en el Frontend.
- **Baneo Permanente en Auth**: El agente objetivo recibe un `BanDuration` de `876000h` (100 años) a través de Supabase Admin Auth API.
- **Account Ownership Total**: TODAS las propiedades (activas, reservadas, alquiladas, vendidas) y TODOS los contactos del agente saliente se transfieren absoluta e irreversiblemente al nuevo agente.
- **One Trip Transaction**: Todo el cambio en base de datos debe ocurrir en una única ejecución transaccional empleando `ExecuteUpdateAsync`.

## 2. Flujo Frontend (Feature-Sliced Design)
### Vista de Gestión de Agentes
- Inyección de un **"Botón de Pánico" (Desactivar Agente)** en color rojo/warning en la lista de agentes.
- Solo es visible si el UUID de la sesión concuerda con el admin global.

### Modal de Reasignación (`ReasignacionAgenteModal.tsx`)
- Prompt: *"¿A qué agente deseas reasignar las Propiedades y Contactos de este usuario?"*
- Integración con `fuse.js` para crear un buscador en tiempo real sobre la lista de agentes activos.
- Bloqueo de auto-asignación (no se puede asignar al mismo agente que se está desactivando).

## 3. Arquitectura Backend (Vertical Slice)
### Endpoint: `POST /configuracion/agentes/{id:guid}/desactivar`
- Módulo: `CRM_Inmobiliario.Api/Features/Configuracion/DesactivarAgente.cs`
- Pasos Transaccionales (`BeginTransactionAsync`):
  1. Transferir Propiedades: `context.Properties.Where(p => p.AgenteId == agenteId).ExecuteUpdateAsync(s => s.SetProperty(p => p.AgenteId, request.NuevoAgenteId))`
  2. Transferir Contactos: `context.Contactos.Where(c => c.AgenteId == agenteId).ExecuteUpdateAsync(s => s.SetProperty(c => c.AgenteId, request.NuevoAgenteId))`
  3. Inactivar Agente: `context.Agents.Where(a => a.Id == agenteId).ExecuteUpdateAsync(s => s.SetProperty(a => a.Activo, false))`
- Invalidación Auth: 
  `await supabase.Auth.Admin.UpdateUserById(agenteId.ToString(), new AdminUserAttributes { BanDuration = "876000h" })`
