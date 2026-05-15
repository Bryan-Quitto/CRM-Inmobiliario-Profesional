# Tasks: Visibilidad Compartida de Contactos (Spec 017)

## Phase 1: Backend Foundation (Database & Entities)
- [x] 1.1 Crear `Domain/Entities/ContactoAgenteCompartido.cs` con IDs de Contacto y Agente.
- [x] 1.2 Actualizar `Domain/Entities/Contacto.cs` para incluir la navegación `ICollection<ContactoAgenteCompartido> SharedWith`.
- [x] 1.3 Configurar la relación en `Infrastructure/Persistence/CrmDbContext.cs` y crear migración.
- [x] 1.4 Aplicar migración a la base de datos local/Supabase.

## Phase 2: API Logic & Security
- [x] 2.1 Implementar `Features/Contactos/CompartirContacto.cs` (POST) con validación de dueño.
- [x] 2.2 Implementar `Features/Contactos/RevocarCompartido.cs` (DELETE) con selección múltiple.
- [x] 2.3 Modificar `ListarContactosFeature.cs` para incluir contactos compartidos con `Union`.
- [x] 2.4 Actualizar `BuscarContactosFeature.cs` para filtrar por propiedad e incluir compartidos.

## Phase 3: Frontend Core (Types & Hooks)
- [x] 3.1 Actualizar `src/features/contactos/types/index.ts` con `esCompartido` y `nombreAgenteDueno`.
- [x] 3.2 Instalar e integrar `Fuse.js` en los selectores de búsqueda del frontend.
- [x] 3.3 Crear hook `useCompartirContacto` para gestionar las llamadas a la API de compartir/revocar.

## Phase 4: UI/UX Integration
- [x] 4.1 Crear `CompartirContactoModal.tsx` con búsqueda por propiedad/agente y feedback instantáneo.
- [x] 4.2 Actualizar `ContactoCard.tsx` para mostrar tag de Agente, enmascarar datos y bloquear acciones.
- [x] 4.3 Integrar el botón de compartir en la lista de contactos (solo visible para el dueño).
- [x] 4.4 Verificar escenarios de Spec 017: compartir por propiedad, enmascaramiento y revocación múltiple.
