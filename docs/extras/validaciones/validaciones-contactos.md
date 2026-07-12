# Propuesta de Validaciones para Contactos, Interacciones e Intereses

Este documento detalla las reglas de validación propuestas para los campos editables por el usuario en las entidades de gestión de contactos.

---

## 1. Entidad: Contacto

### Campo: `Nombre`
- **Entidad:** Contacto
- **Tipo:** string
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.Nombre).NotEmpty().WithMessage("El nombre es requerido.").MaximumLength(100);`
- **Reglas Frontend (Zod):** `z.string().trim().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres")`
- **Notas de negocio:** Esencial para identificar al contacto. Se debe aplicar `.trim()` para evitar strings compuestos únicamente de espacios en blanco. Se permite el uso de números considerando la migración de contactos desde dispositivos móviles.

### Campo: `Apellido`
- **Entidad:** Contacto
- **Tipo:** string
- **Obligatorio:** No
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.Apellido).MaximumLength(100);`
- **Reglas Frontend (Zod):** `z.string().trim().max(100, "Máximo 100 caracteres").optional().or(z.literal(''))`
- **Notas de negocio:** Opcional, pero si se provee, no debe superar la longitud máxima. Se permite el uso de números considerando la migración de contactos desde dispositivos móviles.

### Campo: `Email`
- **Entidad:** Contacto
- **Tipo:** string
- **Obligatorio:** No
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.Email).EmailAddress().WithMessage("El formato de email no es válido.").MaximumLength(150);`
- **Reglas Frontend (Zod):** `z.string().trim().email("Formato de email inválido").max(150).optional().or(z.literal(''))`
- **Notas de negocio:** Validar formato estricto de email. Es opcional ya que un contacto proveniente de redes sociales podría no tenerlo.

### Campo: `Telefono`
- **Entidad:** Contacto
- **Tipo:** string
- **Obligatorio:** No
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.Telefono).MaximumLength(20).Matches(@"^\+?[0-9\s\-]+$").WithMessage("El formato del teléfono es inválido.");`
- **Reglas Frontend (Zod):** `z.string().trim().max(20).regex(/^\+?[0-9\s\-]+$/, "Formato inválido").optional().or(z.literal(''))`
- **Notas de negocio:** Opcional. Se valida longitud y caracteres básicos. La clase `PhoneExtensions.cs` normalizará a formato E.164 internamente.

### Campo: `Origen`
- **Entidad:** Contacto
- **Tipo:** string
- **Obligatorio:** Sí (con valor por defecto "Directo")
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.Origen).NotEmpty().MaximumLength(50);`
- **Reglas Frontend (Zod):** `z.string().min(1, "El origen es requerido").max(50)`
- **Notas de negocio:** El origen está restringido con un dropdown al crear/editar el contacto. Restringir en el backend a los mismos valores si se implementa un Enum.

### Campo: `EstadoEmbudo`
- **Entidad:** Contacto
- **Tipo:** string
- **Obligatorio:** Sí (con valor por defecto "Nuevo")
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.EstadoEmbudo).NotEmpty().MaximumLength(50);`
- **Reglas Frontend (Zod):** `z.string().min(1, "El estado del embudo es requerido").max(50)`
- **Notas de negocio:** Está restringido con un dropdown al crear/editar el contacto. Restringir a valores conocidos del flujo (ej: Nuevo, Contactado, Negociación, Cerrado, Perdido).

### Campo: `EsCliente`
- **Entidad:** Contacto
- **Tipo:** bool
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.EsCliente).NotNull();`
- **Reglas Frontend (Zod):** `z.boolean()`
- **Notas de negocio:** Permite diferenciar prospectos de clientes consolidados.

### Campo: `EstadoPropietario`
- **Entidad:** Contacto
- **Tipo:** string
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.EstadoPropietario).NotEmpty().MaximumLength(50);`
- **Reglas Frontend (Zod):** `z.string().min(1, "El estado de propietario es requerido").max(50)`
- **Notas de negocio:** Solo relevante si `EsPropietario` es true. Está restringido con un dropdown al crear/editar el contacto.

### Campo: `EsPropietario`
- **Entidad:** Contacto
- **Tipo:** bool
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.EsPropietario).NotNull();`
- **Reglas Frontend (Zod):** `z.boolean()`
- **Notas de negocio:** Define si el contacto posee propiedades para captación.

### Campo: `Notas`
- **Entidad:** Contacto
- **Tipo:** string
- **Obligatorio:** No
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.Notas).MaximumLength(2000);`
- **Reglas Frontend (Zod):** `z.string().max(2000).optional().or(z.literal(''))`
- **Notas de negocio:** Campo de texto libre. Se sugiere límite para evitar sobrecarga.

### Campo: `BotActivoWA` y `BotActivoFB`
- **Entidad:** Contacto
- **Tipo:** bool
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.BotActivoWA).NotNull();` / `RuleFor(x => x.BotActivoFB).NotNull();`
- **Reglas Frontend (Zod):** `z.boolean()`
- **Notas de negocio:** Controla si los bots de IA pueden responder automáticamente por cada canal.

---

## 2. Entidad: ContactoInteresPropiedad

### Campo: `NivelInteres`
- **Entidad:** ContactoInteresPropiedad
- **Tipo:** string
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.NivelInteres).NotEmpty().MaximumLength(50);`
- **Reglas Frontend (Zod):** `z.string().min(1).max(50)`
- **Notas de negocio:** Está restringido con un dropdown al crear/editar.

---

## 3. Entidad: Interaction (Interacciones)

### Campo: `TipoInteraccion`
- **Entidad:** Interaction
- **Tipo:** string
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.TipoInteraccion).NotEmpty().MaximumLength(50);`
- **Reglas Frontend (Zod):** `z.string().min(1, "El tipo de interacción es requerido").max(50)`
- **Notas de negocio:** Está restringido con un menú horizontal al crear/editar el contacto. Existe también un tipo "Sistema" que se asigna automáticamente.

### Campo: `Notas`
- **Entidad:** Interaction
- **Tipo:** string
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.Notas).NotEmpty().WithMessage("Debe ingresar los detalles de la interacción.").MaximumLength(500);`
- **Reglas Frontend (Zod):** `z.string().min(1, "Las notas son obligatorias").max(500, "Máximo 500 caracteres")`
- **Notas de negocio:** El cuerpo principal de la bitácora de seguimiento.

---

## Campos Excluidos

Los siguientes campos han sido excluidos de la validación de creación/edición de usuario debido a que son de solo lectura, auto-generados por el sistema, o calculados dinámicamente:

* **En Contacto:**
  * `Id`: Auto-generado por la BD (UUID).
  * `AgenteId`: Asignado automáticamente.
  * `FechaCreacion`: Auto-generado al insertar el registro.
  * `FechaCierre`: Modificado por el sistema según cambios de estado de negocio.
  * `NumeroInteracciones`, `NumeroIntereses`, `NumeroPropiedadesCaptadas`, `NumeroReservas`, `NumeroCierres`: Contadores calculados o actualizados vía triggers/eventos.
  * `NormalizedSearchText`: Calculado en el backend para agilizar búsquedas.
  * `PendingEscalamientoJobId`, `PendingEscalamientoTareaId`: Control interno del sistema para escalamiento.
  * `EstadoIA_WA`, `EstadoIA_FB`, `FacebookSenderId`, `TransferenciaNotificada`: Gestionados por integraciones externas y bots, no por carga manual de usuario.
  * Relaciones de navegación (`CompartidoCon`, `PropertiesOwned`, `Transactions`, etc.).

* **En ContactoAgenteCompartido:**
  * `ContactoId`, `AgenteId`: Asignados automáticamente según el contexto.
  * `FechaCompartido`: Timestamp auto-generado al crear la relación.

* **En ContactoHistorialEmbudo:**
  * Todo el modelo (`Id`, `EstadoAnterior`, `EstadoNuevo`, `FechaCambio`) se genera típicamente en background al actualizar el `EstadoEmbudo` del `Contacto`. No se expone en formularios de edición directa por el usuario.

* **En ContactoInteresPropiedad:**
  * `ContactoId`, `PropiedadId`: Asignados automáticamente según el contexto.
  * `FechaRegistro`: Timestamp auto-generado.

* **En Interaction:**
  * `Id`: Auto-generado por la BD.
  * `AgenteId`, `ContactoId`, `PropiedadId`: Asignados automáticamente según el contexto.
  * `FechaInteraccion`: Timestamp auto-generado al momento de crear el registro de interacción.
