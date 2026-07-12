# Validaciones para Agentes y Agencias

Este documento define las reglas de validación para los campos editables por los usuarios (administradores desde el panel Admin, o agentes desde su perfil/configuración) en las entidades `Agent` y `Agency`.

---

## Entidad: `Agent`

### Campo: `Nombre`
- **Entidad:** Agent
- **Tipo:** string
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `NotEmpty().WithMessage("El nombre es requerido.")`, `MaximumLength(100).WithMessage("El nombre no puede exceder los 100 caracteres y debe contener al menos 1 caracter.")`, `Matches(@"^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$").WithMessage("El nombre solo puede contener letras y espacios.")`
- **Reglas Frontend (Zod):** `z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres, mínimo 1").regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras y espacios")`
- **Notas de negocio:** Nombre de pila del agente. Es vital para la personalización de la IA y notificaciones. No se permiten números.

### Campo: `Apellido`
- **Entidad:** Agent
- **Tipo:** string
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `NotEmpty().WithMessage("El apellido es requerido.")`, `MaximumLength(100).WithMessage("El apellido no puede exceder los 100 caracteres y debe contener al menos 1 caracter.")`, `Matches(@"^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$").WithMessage("El apellido solo puede contener letras y espacios.")`
- **Reglas Frontend (Zod):** `z.string().min(1, "El apellido es requerido").max(100, "Máximo 100 caracteres, mínimo 1").regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El apellido solo puede contener letras y espacios")`
- **Notas de negocio:** Apellido del agente. No se permiten números.

### Campo: `Email`
- **Entidad:** Agent
- **Tipo:** string
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `NotEmpty().WithMessage("El correo electrónico es requerido.")`, `EmailAddress().WithMessage("Formato de correo inválido.")`, `MaximumLength(255)`
- **Reglas Frontend (Zod):** `z.string().min(1, "El correo electrónico es requerido").email("Formato de correo inválido").max(255)`
- **Notas de negocio:** Debe ser único. Servirá de base para la vinculación con el ID de Supabase Auth.

### Campo: `DireccionFisica`
- **Entidad:** Agent
- **Tipo:** string
- **Obligatorio:** No
- **Reglas Backend (FluentValidation):** `MaximumLength(500)` 
- **Reglas Frontend (Zod):** `z.string().max(500, "Máximo 500 caracteres").optional().or(z.literal(''))`
- **Notas de negocio:** Dirección de la oficina o de contacto del agente para fines formales.

### Campo: `PromptPersonalIA`
- **Entidad:** Agent
- **Tipo:** string
- **Obligatorio:** No
- **Reglas Backend (FluentValidation):** `MaximumLength(2000)`
- **Reglas Frontend (Zod):** `z.string().max(2000, "El prompt personal no puede exceder 2000 caracteres").optional().or(z.literal(''))`
- **Notas de negocio:** Define la personalidad y directrices de la IA al comunicarse en nombre de este agente específico.

### Campo: `Telefono`
- **Entidad:** Agent
- **Tipo:** string
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `NotEmpty().WithMessage("El teléfono es requerido.")`, `MaximumLength(20)`. Además, se debe procesar utilizando la extensión `NormalizePhoneE164()` definida en `PhoneExtensions.cs` para su normalización.
- **Reglas Frontend (Zod):** `z.string().min(1, "El teléfono es requerido").max(20, "Máximo 20 caracteres").regex(/^[0-9+\-\s()]*$/, "Formato de teléfono inválido")`
- **Notas de negocio:** Teléfono de contacto directo del agente, usado para el perfil.



### Campo: `AiApiKey`
- **Entidad:** Agent
- **Tipo:** string
- **Obligatorio:** No
- **Reglas Backend (FluentValidation):** `MaximumLength(2000)`
- **Reglas Frontend (Zod):** `z.string().max(2000).optional().or(z.literal(''))`
- **Notas de negocio:** Clave API (BYOK - Bring Your Own Key) para el proveedor de IA. Su inserción debe estar ofuscada en frontend.


### Campo: `IsPersonalAiEnabled`, `IsWhatsAppAiEnabled`, `IsFacebookAiEnabled`
- **Entidad:** Agent
- **Tipo:** boolean
- **Obligatorio:** Sí (con valor por defecto `false`)
- **Reglas Backend (FluentValidation):** Tipado booleano, se deben permitir valores por defecto.
- **Reglas Frontend (Zod):** `z.boolean().default(false)`
- **Notas de negocio:** Switches o toggles en la pantalla de configuración del agente para activar/desactivar automatizaciones.

### Campo: `WhatsAppPhoneNumberId`
- **Entidad:** Agent
- **Tipo:** string
- **Obligatorio:** Condicional (Requerido si la IA en dicha red está habilitada).
- **Reglas Backend (FluentValidation):** `NotEmpty().When(x => x.IsWhatsAppAiEnabled == true)`
- **Reglas Frontend (Zod):** Si `IsWhatsAppAiEnabled` es `true`, este campo es obligatorio con un `.min(1)`.
- **Notas de negocio:** Credencial para conectarse a la API de WhatsApp.

### Campo: `NotifyOverdueTasksIntervalMinutes`, `NotifyTodayTasksAdvanceMinutes`, `NotifyTodayTasksIntervalMinutes`, `NotifyAiHelpTasksIntervalMinutes`, `NotifyAiHelpTasksMaxRetries`, `NotifyOverdueTasksMaxHours`
- **Entidad:** Agent
- **Tipo:** integer
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `GreaterThanOrEqualTo(0)` (o > 0 donde aplique). 
- **Reglas Frontend (Zod):** `z.number().int().min(0, "No puede ser menor a cero")`
- **Notas de negocio:** Configuración granular de notificaciones y recordatorios para el flujo de tareas del usuario.

### Campo: `AutoArchivarContactos`, `AutoArchivarPropiedades`
- **Entidad:** Agent
- **Tipo:** boolean
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** Booleano estándar.
- **Reglas Frontend (Zod):** `z.boolean().default(false)`
- **Notas de negocio:** Activa las rutinas de limpieza automática.

### Campo: `DiasInactividadContactos`, `DiasInactividadPropiedades` 
- **Entidad:** Agent
- **Tipo:** integer
- **Obligatorio:** Condicional
- **Reglas Backend (FluentValidation):** `InclusiveBetween(100, 1095)`
- **Reglas Frontend (Zod):** `z.number().int().min(100, "Mínimo 100 días").max(1095, "Máximo 1095 días (3 años)")`
- **Notas de negocio:** Determina en cuántos días de inactividad un elemento es mandado a archivar.

---

### Campos de Límites de Uso (Administradores)
### Campo: `DailyTokenLimitPerContact`, `DailyTokenLimitPersonal`, `DailyTokenLimitFacebook`, `MonthlyStorageUploadsLimit`, `MonthlyStorageBytesLimit`
- **Entidad:** Agent
- **Tipo:** integer / long
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `GreaterThanOrEqualTo(0)`
- **Reglas Frontend (Zod):** `z.number().min(0, "No puede ser negativo")`
- **Notas de negocio:** Estos campos dictaminan límites de uso por cuotas (Billing/Planes). Son editables por los administradores o los usuarios dentro de un rango preestablecido.

## Entidad: `Agency`

### Campo: `Nombre`
- **Entidad:** Agency
- **Tipo:** string
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `NotEmpty().WithMessage("El nombre de la agencia es requerido.")`, `MaximumLength(150)`
- **Reglas Frontend (Zod):** `z.string().min(1, "Requerido").max(150)`
- **Notas de negocio:** Nombre público de la agencia inmobiliaria. No se restringen números ya que las agencias suelen contenerlos (ej. Century 21).

### Campo: `TelefonoCorporativo`
- **Entidad:** Agency
- **Tipo:** string
- **Obligatorio:** No
- **Reglas Backend (FluentValidation):** `MaximumLength(20)`. Además, se debe procesar utilizando la extensión `NormalizePhoneE164()` definida en `PhoneExtensions.cs` para su normalización.
- **Reglas Frontend (Zod):** `z.string().max(20).regex(/^[0-9+\-\s()]*$/, "Formato de teléfono inválido").optional().or(z.literal(''))`
- **Notas de negocio:** Teléfono principal de la agencia.

### Campo: `EmailCorporativo`
- **Entidad:** Agency
- **Tipo:** string
- **Obligatorio:** No
- **Reglas Backend (FluentValidation):** `EmailAddress().When(x => !string.IsNullOrEmpty(x.EmailCorporativo))`, `MaximumLength(255)`
- **Reglas Frontend (Zod):** `z.string().email("Formato inválido").max(255).optional().or(z.literal(''))`
- **Notas de negocio:** Correo general corporativo.

### Campo: `DireccionFisica`
- **Entidad:** Agency
- **Tipo:** string
- **Obligatorio:** No
- **Reglas Backend (FluentValidation):** `MaximumLength(500)`
- **Reglas Frontend (Zod):** `z.string().max(500).optional().or(z.literal(''))`
- **Notas de negocio:** Ubicación física u oficina central.

### Campo: `SitioWeb`
- **Entidad:** Agency
- **Tipo:** string
- **Obligatorio:** No
- **Reglas Backend (FluentValidation):** `MaximumLength(255)` (Podría validarse como URI `Must(uri => Uri.TryCreate(...))`)
- **Reglas Frontend (Zod):** `z.string().url("Debe ser una URL válida").max(255).optional().or(z.literal(''))`
- **Notas de negocio:** Enlace al portal inmobiliario principal.

### Campo: `ContextoCorporativoIA`
- **Entidad:** Agency
- **Tipo:** string
- **Obligatorio:** No
- **Reglas Backend (FluentValidation):** `MaximumLength(2000)`
- **Reglas Frontend (Zod):** `z.string().max(2000).optional().or(z.literal(''))`
- **Notas de negocio:** Directrices globales para la IA a nivel de agencia que heredan todos los agentes en sus conversaciones.

---

## Campos Excluidos

Los siguientes campos, aunque presentes en los modelos de base de datos, no deben ser editados directamente mediante un formulario de usuario porque son gestionados de forma sistémica, automática, o por métricas de fondo:

- **En la entidad `Agent`:**
  - `Id`: Es generado y administrado por el Identity Provider (Supabase Auth).
  - `AgenciaId`: Asignado automáticamente o por un Administrador.
  - `Rol`: Asignado automáticamente o por un Administrador (Controla nivel de acceso).
  - `Activo`: Gestionado sistémicamente (Indica si puede iniciar sesión).
  - `ActiveLLMProvider`: Asignado automáticamente por configuración global.
  - `FacebookPageId`, `FacebookPageAccessToken`, `FacebookPageName`: Asignados automáticamente en el proceso de vinculación.
  - `CreatedById` / `CreatedBy`: Auditoría y trazabilidad interna.
  - `FotoUrl` / `LogoUrl`: Aunque se editan, generalmente se manejan a través de un endpoint separado para *Upload de Archivos*, que luego actualiza esta propiedad en background y no como un input de texto tradicional.
  - `ByokKeyStatus`: Es evaluado por un servicio en background que verifica si la Key ingresada es válida o ha expirado.
  - `TerminosAceptadosVersion`: Se maneja a través del flujo de aceptación legal.
  - `FechaCreacion`, `FechaEliminacion`: Manejados mediante el ciclo de vida de Entity Framework (Soft delete y TimeStamps).
  - Listas de Relación (`ContactosCompartidos`, `Contactos`, `Properties`, `Tasks`, `Interactions`, `PushSubscriptions`): Manejadas a través de relaciones de Entity Framework.

- **En la entidad `Agency`:**
  - `Id`: PK Autogenerado.
  - `FechaCreacion`: Timestamp sistémico.
  - `Agents`: Relación en base de datos.

- **Entidad `AgentPushSubscription` completa:**
  - Es el registro para recibir notificaciones VAPID (Web Push Notifications). Todo el proceso de enrolamiento (Endpoint, keys P256dh, Auth) lo genera el navegador a través de Service Workers; no es un ingreso manual.

- **Entidad `AgentStorageUsage` completa:**
  - Entidad analítica para sumar de forma transaccional el espacio consumido por mes y año. Se actualiza automáticamente cuando el agente sube archivos.
