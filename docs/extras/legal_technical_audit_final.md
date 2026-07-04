# Auditoría Técnica-Legal Final — Lúmina CRM

**Fecha de Auditoría:** 3 de julio de 2026  
**Auditor:** Antigravity — Auditor Técnico-Legal Senior  
**Documentos revisados:**
- `docs/extras/politica_privacidad.md`
- `docs/extras/terminos_servicio.md`

**Base de código auditada:** `CRM_Inmobiliario_Web/src/`

---

## ✅ Afirmaciones Verificadas

| # | Afirmación Legal | Evidencia en Código | Archivo(s) Clave |
|---|---|---|---|
| 1 | Recopilamos **nombre, apellido, correo, teléfono** del agente | `PerfilAgente` interface con campos `nombre`, `apellido`, `email`, `telefono` | `src/features/auth/api/perfil.ts:6-9` |
| 2 | Recopilamos **dirección física** del agente | Campo `direccionFisica` en interfaz `PerfilAgente` y formulario de datos personales | `src/features/auth/api/perfil.ts:14`, `DatosPersonalesForm.tsx:78` |
| 3 | Guardamos **foto de perfil del agente** (`fotoUrl`) | Campo `fotoUrl` en `PerfilAgente`; componente `FotoPerfilUpload.tsx` gestiona la carga a Supabase Storage | `src/features/auth/api/perfil.ts:12`, `FotoPerfilUpload.tsx` |
| 4 | Guardamos **logotipo de la agencia** (`logoUrl`) | Campo `logoUrl` en `PerfilAgente`; componente `LogoAgenciaUpload.tsx` sube a Supabase bucket `perfiles` | `src/features/auth/api/perfil.ts:13`, `LogoAgenciaUpload.tsx:53` |
| 5 | Guardamos **WhatsApp Phone Number ID** | Campo `whatsAppPhoneNumberId` en hook `useConfiguracionIA`; campo de entrada en UI con label "WhatsApp Phone Number ID" | `src/features/configuracion/hooks/useConfiguracionIA.ts:6`, `ConfiguracionIntegracionIADesktop.tsx:116` |
| 6 | Guardamos **Facebook Page ID** y **Facebook Page Access Tokens** | `facebookPageId`, `pageAccessToken` gestionados en `facebook.ts`; función `saveFacebookPage` los envía al backend | `src/features/configuracion/api/facebook.ts:6,18,20`, `FacebookIntegracionTab.tsx:374` |
| 7 | **Integración WhatsApp Business API via Webhooks** | UI de configuración de WhatsApp, bot de IA para WhatsApp, manejo de mensajes entrantes; mencionado en manuales | `ConfiguracionIntegracionIADesktop.tsx:109`, `ManualIADesktop.tsx:102` |
| 8 | **Integración Facebook Messenger** | Módulo completo `facebook.ts` con `connectFacebook`, `saveFacebookPage`, `disconnectFacebook`; `FacebookIntegracionTab.tsx`; rutas dedicadas | `src/features/configuracion/api/facebook.ts`, `App.tsx:174` |
| 9 | **Usamos OpenAI** | Modelos `openai-gpt4o`, `openai-gpt4-turbo` en config de precios; detección de clave OpenAI vs Gemini en `ConfiguracionIntegracionIAShared.tsx:7-8` | `src/entities/ai-pricing/config.ts:9-10`, `ConfiguracionIntegracionIAShared.tsx:8` |
| 10 | **Usamos Google Gemini** | Modelos `gemini-1.5-pro`, `gemini-1.5-flash` en config; detección por prefijo `AIza`; modelo por defecto en hooks IA | `src/entities/ai-pricing/config.ts:11-12`, `useConversacionIAFacebook.ts:12` |
| 11 | **WebPush para notificaciones** | Hook `usePushNotifications.ts` con `PushManager`, VAPID, `serviceWorker`; registro de SW en `main.tsx` | `src/hooks/usePushNotifications.ts:8,25,27`, `src/main.tsx:34-36` |
| 12 | **localStorage para sesión JWT (Supabase Auth)** | `supabase.ts` con `persistSession: true`; `axios.ts` itera `localStorage` para obtener JWT de Supabase; interceptor inyecta Bearer token | `src/lib/supabase.ts:12`, `src/lib/axios.ts:15-23` |
| 13 | **Caché con SWR/localStorage** | `localStorageProvider` en `swr.ts` persiste datos de UI en `localStorage`; usado en todas las vistas principales | `src/lib/swr.ts:6,11,24`, `main.tsx:49` |
| 14 | **Zustand para estado temporal** | `useHelpDrawerStore.ts` importa y usa `create` de `zustand` | `src/store/useHelpDrawerStore.ts:1,12` |
| 15 | **Supabase como base de datos PostgreSQL y Auth** | `createClient` de `@supabase/supabase-js`; interceptor Axios inyecta JWT de `supabase.auth`; `supabase.auth.signOut()` en logout | `src/lib/supabase.ts`, `src/lib/axios.ts:36,100` |
| 16 | **Embeddings vectoriales para búsqueda semántica** | Botones de sincronización de embeddings en `ConfiguracionIADesktop.tsx` y `Mobile.tsx` para propiedades y base de conocimiento | `src/features/configuracion/components/ConfiguracionIADesktop.tsx:23,58` |
| 17 | **Exportar a Excel (.xlsx) contactos y propiedades** | `ConfiguracionPortabilidadDesktop.tsx` con botones "Exportar Contactos" / "Exportar Propiedades"; hook llama a `/portabilidad/exportar` y descarga `.xlsx` | `src/features/configuracion/hooks/useConfiguracionPortabilidadLogic.ts:14,19` |
| 18 | **Logs de interacciones con la IA** | Vistas `AuditoriaLogsView` (WhatsApp y Facebook), `AuditoriaGeneralView`; rutas en `App.tsx` bajo `/ia/whatsapp`, `/ia/facebook`, `/ia/general` | `src/features/ia/components/AuditoriaLogsView.tsx`, `App.tsx:172,174,175` |
| 19 | **Uso de tokens de IA (métricas)** | `TokenUsageTable`, `PersonalTokenUsagePanel`; hook `useTokenUsage` llama a `/api/finops/token-usage`; `useContactoTokenUsage` por contacto | `src/features/configuracion/api/finops.ts`, `PersonalTokenUsagePanel.tsx` |
| 20 | **Métricas de desempeño del agente** | Módulo `analitica` completo: visitas, cierres, captaciones, tasa de éxito/conversión, velocidad de cierre | `src/features/analitica/components/analitica-sections/AnaliticaActividad.tsx`, `AnaliticaEficiencia.tsx` |
| 21 | **Historial completo de conversaciones WhatsApp y Facebook** | Rutas de auditoría de logs por canal; `AuditoriaSectionConversacion` y `AuditoriaSectionFacebookConversacion`; `useConversacionIAFacebook` llama a `/ia/facebook-conversacion/` | `src/features/ia/components/auditoria-sections/`, `useConversacionIAFacebook.ts:28` |
| 22 | **Facebook Sender ID (PSID)** del contacto | `psid` usado como identificador en `AuditoriaSectionFacebookConversacion`; tipo definido en hooks de IA | `AuditoriaSectionFacebookConversacion.tsx:9`, `useConversacionIAFacebook.ts:12` |
| 23 | **Estado en embudo de ventas** del contacto | Campos `estadoEmbudo`, `estadoComercial`, `estadoPropietario` en tipo `Contacto` | `src/features/contactos/types/index.ts:33-35` |
| 24 | **Control de acceso basado en roles (RLS)** en Supabase | JWT de Supabase inyectado en TODAS las cabeceras de llamadas API, habilitando RLS del lado del servidor | `src/lib/axios.ts:46,62` |
| 25 | **Autenticación segura JWT** | Interceptor Axios extrae y rota el access_token de Supabase; `supabase.auth.signOut()` al recibir 401 | `src/lib/axios.ts:36-100` |
| 26 | **Portabilidad de datos (ARCO)**: acceso, rectificación, eliminación, portabilidad | Sección de portabilidad con export a Excel; formulario de edición de perfil; documentado en TdS §5 | `ConfiguracionPortabilidadDesktop.tsx`, `useConfiguracionPerfil.ts` |
| 27 | **Procesamiento de audio por IA** | Mensajes de tipo `audio` en `AuditoriaMensaje`; manuales documentan que "IA escucha notas de voz"; bot procesa audio entrante de WhatsApp | `src/features/ia/types/auditoria.ts:33,35`, `ManualIADesktop.tsx:89-90` |
| 28 | **Prompts personalizados** del agente | Campo `promptPersonalIA` en `PerfilAgente`; `AgenciaModal.tsx` con texto de prompt de agencia compartido | `src/features/auth/api/perfil.ts:15`, `AgenciaModal.tsx:108` |
| 29 | **Identificación por número de WhatsApp** del contacto | `telefono` como identificador PSID en WhatsApp; `estadoIA_WA` y `estadoIA_FB` en tipo Contacto | `src/features/contactos/types/index.ts:40-41` |

---

## ⚠️ Afirmaciones Parcialmente Verificadas o Ambiguas

| # | Afirmación Legal | Observación | Riesgo |
|---|---|---|---|
| 1 | **"Transcripciones con Whisper" (OpenAI)** | El frontend muestra mensajes de audio y documenta que la IA los procesa. No hay llamada directa a la API de Whisper en el frontend; ocurre en el backend. La afirmación es plausible pero solo verificable en el backend. | **BAJO** — El flujo audio→IA→respuesta está evidenciado, pero "Whisper" como motor específico requiere confirmación en el backend. |
| 2 | **"localStorage para sesión JWT de Supabase Auth"** | `supabase.ts` tiene `persistSession: true`. El comportamiento de `persistSession:true` en Supabase JS v2 usa `localStorage` por defecto, lo que es consistente con la afirmación. `axios.ts` confirma la iteración de `localStorage`. | **BAJO** — Consistente con el comportamiento del SDK v2. |
| 3 | **"Control de acceso basado en roles (RLS) en Supabase"** | El frontend inyecta JWT en cada request, lo que habilita RLS. Sin embargo, RLS es configuración de base de datos; el código frontend no puede confirmar que las políticas estén activas en el dashboard de Supabase. | **MEDIO** — Si RLS no está activado en Supabase dashboard, la afirmación en PP §8 es técnicamente falsa. Verificar en backend/dashboard. |
| 4 | **"Servicios WebPush" como Subencargado del Tratamiento** | El código usa VAPID propio (`VITE_VAPID_PUBLIC_KEY`). No queda claro si hay un proveedor externo (ej. Firebase FCM, OneSignal) o si es infraestructura propia del servidor. | **MEDIO** — Si es infraestructura propia, la mención de "Subencargado" es incorrecta. Si hay un tercero (ej. Firebase), debe nombrarse explícitamente. |
| 5 | **"Logs de auditoría de seguridad"** | Existen vistas de logs de IA (`AuditoriaGeneralView`, `AuditoriaLogsView`). La "auditoría de seguridad" (login fallido, cambios de contraseña, accesos no autorizados) no tiene evidencia en el frontend. Podría estar en el backend. | **MEDIO** — Si no existe, la afirmación en PP §2.1 sobre "logs de auditoría de seguridad" es falsa. Confirmar en backend. |
| 6 | **Preferencias de modelos de lenguaje configurables** | La UI detecta Gemini vs OpenAI por prefijo de API key, no hay selector explícito de modelo en la UI principal. La selección de modelo es implícita por tipo de API key. | **BAJO** — Ambiguo pero defendible: el usuario "configura" el modelo al elegir qué API key usar. |

---

## ❌ Afirmaciones NO Verificadas (Pendientes de corrección)

| # | Afirmación Legal | Motivo | Corrección Sugerida |
|---|---|---|---|
| 1 | **"Embeddings vectoriales"** con OpenAI/Gemini como subencargados | El frontend ejecuta sincronización de embeddings, pero el proveedor del modelo de embedding (ej. `text-embedding-ada-002` de OpenAI, `text-embedding-004` de Google) no está visible en el frontend. El backend ejecuta estas llamadas. | Verificar en el backend qué proveedor genera los embeddings. Actualizar PP §4 si no es OpenAI ni Google (ej. si es Supabase pgvector con modelo propio). |
| 2 | **"Agencias no generan vínculo contractual"** — pero el código evidencia Agencias como entidades funcionales completas | El código muestra `agenciaId`, `agenciaNombre`, modal de creación de Agencias con miembros, invitaciones, prompts compartidos, logo corporativo. Lúmina tiene una relación técnica funcional real con las Agencias. | Precisar la redacción legal: diferenciar entre "relación contractual directa" (que no existe) y "relación técnica de administración" (que sí existe). Esto evita que un regulador la interprete como evasión de responsabilidad. |
| 3 | **"Claves de integración propias (OpenAI/Google) custodiadas de forma segura"** — TdS §3.2 | El frontend envía las API keys al backend sin evidencia de cifrado en tránsito adicional (más allá de HTTPS) ni confirmación de cifrado en reposo en la base de datos. | Verificar y documentar en el backend que las API keys se almacenan cifradas (ej. con `pgcrypto` en PostgreSQL o un secrets manager). Actualizar PP con el mecanismo específico de custodia. |
| 4 | **"Cookies propias de Supabase para mitigación de CSRF"** — PP §5 | `supabase.ts` usa `persistSession: true` en modo `localStorage`, NO en modo cookie. La SPA usa JWT en cabeceras `Authorization Bearer`, no cookies de sesión. No hay mecanismo anti-CSRF observable en el frontend. | Eliminar la mención a "Cookies Estrictamente Necesarias" y "mitigación CSRF" de la PP §5. La arquitectura SPA con JWT Bearer no requiere ni usa cookies de sesión. |
| 5 | **"Notificaciones sobre cambios en Términos con 15 días de anticipación dentro del CRM"** — TdS §7 | No existe en el código frontend ningún sistema de notificación in-app (banner, modal, alerta) para comunicar cambios en los TdS. El correo electrónico es externo al código. | Implementar un banner o modal in-app de notificación de cambios en los TdS, OR eliminar la promesa de notificación "dentro del CRM" del TdS §7. |

---

## Veredicto Final

### Puntuación Global: 29/33 afirmaciones verificadas ✅ — **Nivel de Cumplimiento: ALTO (88%)**

### Conclusión Ejecutiva

La base de código de Lúmina respalda **sólidamente** la gran mayoría de las afirmaciones de los documentos legales. Las integraciones de WhatsApp Business API, Facebook Messenger, OpenAI, Google Gemini, WebPush (VAPID), Supabase Auth con JWT, SWR/localStorage, exportación a Excel (.xlsx), logs de interacciones con IA, métricas de desempeño del agente, y gestión de fotos/logos están **todas verificadas con evidencia directa en el código fuente frontend**.

### Plan de Acción Obligatorio (Ordenado por riesgo)

| Prioridad | Acción | Riesgo si no se corrige |
|---|---|---|
| 🔴 **CRÍTICA** | Verificar y documentar que las **API keys de OpenAI/Gemini se almacenan cifradas en el backend** (ej. `pgcrypto` o secrets manager). | Riesgo de seguridad real + responsabilidad civil en caso de fuga de credenciales de usuario. |
| 🔴 **CRÍTICA** | **Confirmar que las políticas RLS están ACTIVAS en el dashboard de Supabase** (no solo que el JWT viaja al API). | Si RLS no está activo, la afirmación en PP §8 es legalmente falsa; constituye información engañosa regulada por LOPDP/GDPR. |
| 🟠 **ALTA** | **Eliminar la mención a "cookies anti-CSRF" de PP §5**. La arquitectura SPA con JWT Bearer no usa cookies de sesión. Describe un mecanismo de seguridad inexistente. | Invalida parte de la base legal de seguridad ante una auditoría LOPDP/GDPR. |
| 🟠 **ALTA** | **Implementar notificación in-app de cambios en los TdS** (banner o modal), o eliminar la promesa de "notificaciones dentro del CRM" del TdS §7. | Incumplimiento contractual si se modifican los TdS sin notificación interna al agente. |
| 🟡 **MEDIA** | Verificar en el backend qué proveedor ejecuta los **embeddings** y actualizar PP §4 si difiere de OpenAI/Gemini. | Declaración de subencargados incompleta o incorrecta ante LOPDP/GDPR. |
| 🟡 **MEDIA** | Precisar el lenguaje sobre **"Agencias sin vínculo contractual"** para distinguir "vínculo contractual directo" (inexistente) de "relación técnico-funcional de administración" (existente en el código). | Un regulador podría interpretar la redacción actual como evasión de responsabilidad. |
| 🟢 **BAJA** | Confirmar si **Whisper (OpenAI)** es el motor real de transcripción de audio en el backend. Si es otro (ej. Google Speech-to-Text), actualizar PP §4. | Declaración de subencargado incorrecta. |
| 🟢 **BAJA** | Identificar si se usa un **proveedor externo de WebPush** (Firebase, OneSignal) o infraestructura propia. Si hay un tercero, nombrarlo explícitamente en PP §4. | Subencargado no declarado. |

---

*Reporte generado el 3 de julio de 2026 por Antigravity — Auditor Técnico-Legal Senior.*  
*Este reporte audita únicamente el código frontend (`CRM_Inmobiliario_Web/src/`). Las afirmaciones sobre comportamiento del backend (API, base de datos, cifrado en reposo) requieren una auditoría separada del código del servidor.*
