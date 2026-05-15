# Design: Visibilidad Compartida de Contactos

## Technical Approach
Implementaremos una tabla intermedia `ContactoAgenteCompartido` para manejar la relación muchos-a-muchos entre Contactos y Agentes (receptores). Modificaremos los endpoints de lectura para incluir estos contactos y la UI para aplicar restricciones de "Solo Lectura" y enmascaramiento de datos.

## Architecture Decisions

### Decision: Tabla Intermedia vs Flag
**Choice**: Tabla Intermedia `ContactoAgenteCompartido`.
**Alternatives considered**: Lista de IDs (JSONB) en la tabla `Contacto`.
**Rationale**: La tabla intermedia permite consultas más eficientes (joins), integridad referencial nativa y mayor escalabilidad para reportes de colaboración.

### Decision: Enmascaramiento de Datos
**Choice**: Enmascaramiento en el Frontend basado en un flag `esCompartido`.
**Alternatives considered**: Enmascaramiento en el Backend.
**Rationale**: Mantener la API simple y enviar el dato real permite que el cliente lo use en modales de transacción (donde sí se necesita el ID para asociar), mientras que la UI protege la visualización directa. Sin embargo, por seguridad extrema, el `ListarContactos` devolverá el flag y el frontend decidirá qué mostrar.

## Data Flow

1. **Compartir**: Agente Dueño -> POST `/contactos/{id}/compartir` -> DB insert `ContactoAgenteCompartido`.
2. **Listar**: Agente Receptor -> GET `/contactos` -> DB Query `Where(AgenteId == Me || CompartidoCon.Contains(Me))` -> UI render con restricciones.
3. **Buscar (Fuse.js)**: Frontend descarga lista completa -> Fuse.js indexa -> Búsqueda difusa instantánea.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `Domain/Entities/ContactoAgenteCompartido.cs` | Create | Nueva entidad para la relación N:N. |
| `Domain/Entities/Contacto.cs` | Modify | Agregar colección de `CompartidoCon`. |
| `Infrastructure/Persistence/CrmDbContext.cs` | Modify | Agregar `DbSet` y configuración. |
| `Features/Contactos/CompartirContacto.cs` | Create | Endpoint para añadir agentes a la visibilidad. |
| `Features/Contactos/RevocarCompartido.cs` | Create | Endpoint para quitar agentes de la visibilidad. |
| `Features/Contactos/ListarContactos.cs` | Modify | Incluir contactos compartidos en la consulta. |
| `Features/Contactos/BuscarContactos.cs` | Modify | Incluir contactos compartidos en la búsqueda. |
| `src/features/contactos/types/index.ts` | Modify | Agregar campos `esCompartido` y `nombreAgenteDueno`. |
| `src/features/contactos/components/contactos-list-sections/ContactoCard.tsx` | Modify | Aplicar UI de solo lectura y enmascaramiento. |
| `src/features/contactos/components/CompartirContactoModal.tsx` | Create | Modal con búsqueda Fuse.js y feedback de agente. |

## Interfaces / Contracts

### API: Compartir Contacto
**POST** `/contactos/{id}/compartir`
```json
{
  "agenteIds": ["uuid1", "uuid2"]
}
```

### API: Revocar Visibilidad
**DELETE** `/contactos/{id}/compartir`
```json
{
  "agenteIds": ["uuid1"]
}
```

### DTO ContactoResponse (Actualizado)
```csharp
public record ContactoResponse(
    // ... campos existentes ...
    bool EsCompartido,
    string? NombreAgenteDueno
);
```

## Testing Strategy
- **Unit (Backend)**: Validar que solo el dueño pueda compartir/revocar.
- **Integration (API)**: Verificar que `ListarContactos` devuelva compartidos correctamente.
- **UI (Frontend)**: Validar que el botón "Editar" desaparezca y el teléfono esté enmascarado para contactos compartidos.

## Migration / Rollout
Se requiere una migración de base de datos para crear la tabla `ContactoAgenteCompartido`. No se requiere migración de datos existentes.
