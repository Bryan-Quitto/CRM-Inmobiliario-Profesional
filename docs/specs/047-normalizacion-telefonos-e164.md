# Spec 047: Normalización Global de Teléfonos (E.164)

## 1. Contexto e Intención
El sistema sufría de una falencia de normalización donde los números de teléfono se guardaban de manera "cruda" (con espacios, paréntesis o guiones), lo cual impedía que el índice único de la base de datos (`IX_Contactos_Telefono_AgenteId` en Supabase) bloqueara duplicados efectivamente. La meta técnica de este SDD fue implementar una normalización estricta bajo el estándar mundial E.164 para todo el ecosistema (CRM, Webhooks de WhatsApp e IA).

## 2. Decisiones Arquitectónicas

### 2.1 Backend (.NET 10)
- **Librería de Normalización:** Se integró el estándar de la industria `libphonenumber-csharp` (port de la implementación oficial de Google).
- **Capa Transversal:** Creación de la extensión `.NormalizePhoneE164()` en `PhoneExtensions.cs`.
  - Detecta y aplica inteligentemente los códigos internacionales (`+1`, `+34`).
  - Contiene un *fallback* automatizado al prefijo `+593` (Ecuador) para aquellos números locales ingresados sin código de país.
- **Tolerancia a Fallos (Blindaje EF Core):** Obligatoriedad arquitectónica del operador *coalesce* (`??`). Si el parseo colapsa por una entrada basura (ej. un string vacío o nulo), el método devuelve `null`. El uso de `?? payloadOriginal` previene que Entity Framework levante un `DbUpdateException` al intentar actualizar un campo requerido.
  - *Patrón de uso obligatorio:* `Telefono = phone.NormalizePhoneE164() ?? phone;`

### 2.2 Frontend (React 19)
- **Librería de Interfaz:** `react-international-phone`.
- **Componente SSoT:** `<PhoneInputWorldClass />`.
- **Estética Zero-Wait:** El componente inyecta puras utilidades de Tailwind CSS para sobrescribir los estilos de la librería, coincidiendo simétricamente con el diseño premium del CRM Inmobiliario.
- **Rendimiento Anti-Spam:** La validación de duplicidad asíncrona (`useCrearContacto.ts`) implementa un `debounce` de 400ms respaldado por un `AbortController` nativo. 
  - *Memory Leak Prevention:* El `AbortController` cuenta con limpieza explícita (`cleanup`) en el ciclo de unmount del `useEffect` de React.
- **Vinculación React Hook Form:** Todos los formularios operan este componente mediante un `<Controller />`. Para asegurar auto-enfoque al detonar errores de validación, el componente UI utiliza `forwardRef` inyectando `ref` y `onBlur`.

## 3. Matriz de Cobertura
La validación E.164 fue inyectada y auditada doblemente a través de 7 vectores de entrada distintos en el sistema:
1. **Flujo de Contactos:** Endpoints de Creación y Edición (`RegistrarContacto.cs`, `ActualizarContacto.cs`).
2. **Flujo de Perfiles:** Actualización de datos de agente (`ActualizarPerfil.cs`) y Configuración de nuevos invitados (`ActivarPerfil.cs`, `ConfirmarInvitacionForm.tsx`).
3. **Flujo de Propiedades:** Agentes Captadores Invitados (`RegistrarPropiedad.cs`, `ActualizarPropiedad.cs`, `CommissionSection.tsx`).
4. **Flujo Automático (Bots/IA):** Ingesta cruda desde los servidores de Meta (`Webhooks.cs`) y estructuración del contexto semántico del Copiloto (`WhatsAppConversationManager.cs`).

## 4. Limpieza de Entorno
Como parte de la estrategia, la base de datos de desarrollo fue truncada en cascada con la excepción estricta de las tablas maestras estructurales (`Agents`, `Agencies`, `Documents`, `DocumentChunks` y migraciones), sentando una base inmaculada para el almacenamiento E.164 exclusivo.
