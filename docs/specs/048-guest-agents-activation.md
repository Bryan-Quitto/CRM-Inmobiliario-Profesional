# 048 - Activación y Gestión de Agentes Invitados (Shadow Accounts)

## 1. Contexto y Objetivo
En el sistema, las propiedades pueden ser registradas por un Agente (Asistente/Admin) a nombre de un "Agente Captador" que aún no está registrado en la plataforma (Agente Invitado). El objetivo de este diseño es establecer las reglas arquitectónicas y de seguridad para gestionar los permisos cruzados y el flujo de conversión de esta "Cuenta Sombra" a una cuenta real en la plataforma.

## 2. Reglas de Negocio y Permisos
- **Cuenta Sombra (Guest Agent):** Se crea con un correo temporal (`invitado_...`) y `Activo = false`.
- **Acceso del Creador:** El agente que crea la propiedad mantiene los permisos de gestión sobre la misma **exclusivamente** mientras la cuenta del Agente Captador esté inactiva.
- **Transición de Propiedad:** En el instante en que el Agente Invitado activa su cuenta (`Activo = true`), el Creador original pierde automáticamente sus permisos de gestión. El nuevo Agente obtiene el control total.

## 3. Decisiones Arquitectónicas (Backend)

### 3.1 Autorización Dinámica sin Migraciones Masivas
Queda estrictamente prohibido actualizar masivamente las filas en la tabla `Properties` cuando un agente se activa. 
La lógica de permisos se evalúa al vuelo en `PropertyPermissionsHelper.CanManage()` y en las proyecciones LINQ (The One Trip Pattern), verificando:
`(p.AgenteId == currentUserId) || (p.CreatedById == currentUserId && p.Agente.Activo == false)`.

### 3.2 Transacciones y Resiliencia (`ActivarAgenteInvitado.cs`)
Debido a la limitación estricta de concurrencia máxima del proyecto (21 usuarios concurrentes), no existe riesgo crítico de *Connection Pool Starvation*.
El flujo para enviar la invitación es el siguiente:
1. Actualizar la BD local con el correo real del Agente.
2. Hacer la llamada HTTP a Supabase Auth (`InviteUserByEmail`).
3. **Mecanismo de Compensación:** Si la llamada de red a Supabase falla, se ejecuta un *rollback* manual local para devolver el correo a `invitado_...`. Esto evita "Cuentas Fantasma" irrecuperables.

### 3.3 Consistencia de Base de Datos e Índice Único (`ActivarPerfil.cs`)
Durante el proceso final donde el agente establece su contraseña y entra al sistema, se debe insertar su nuevo perfil. Como la base de datos contiene un *Unique Index* en la columna `Email`, la transacción debe ser estrictamente atómica:
1. Transferir el `AgenciaId`, `Propiedades` y `Contactos` de la cuenta sombra a una variable temporal.
2. **Ejecutar `ExecuteDeleteAsync()`** sobre la cuenta sombra (liberando el Email en la base de datos).
3. Insertar el nuevo `Agent` y llamar a `SaveChangesAsync()`.
Todo esto envuelto en `BeginTransactionAsync()`.

### 3.4 Seguridad (Prevención IDOR)
El endpoint de reclamación de cuenta no debe confiar nunca en el `GuestAgentId` enviado desde el cliente web. El sistema **obligatoriamente** valida que el `Email` autenticado a través del token JWT de Supabase coincida de manera exacta con el correo registrado en la base de datos para esa cuenta sombra.

## 4. Frontend y UX (Zero-Wait Policy)
Para la pantalla de Administración (Lista de Agentes y Modal de Activación), se implementó una actualización optimista utilizando SWR:
- Al hacer clic en "Activar", el UI ejecuta `mutate()` inmediatamente, reflejando el cambio de correo y estado sin esperar a la red.
- Si el servidor devuelve un error, se ejecuta un `mutate()` compensatorio haciendo *rollback* de la interfaz a su estado original sin parpadeos.
