---
title: "049: Integración de Facebook Messenger (Configuración y FinOps)"
status: "implemented"
type: "feature"
---

# 049: Integración de Facebook Messenger (Configuración y Webhooks)

## Objetivo
Expandir las capacidades conversacionales del CRM Inmobiliario mediante la integración oficial de la API de Facebook Messenger, permitiendo a los agentes conectar sus páginas de empresa y habilitar un Agente IA para responder mensajes automáticamente.

## Arquitectura

### 1. Autenticación y Autorización (OAuth)
Se implementó el flujo de OAuth de Meta (Facebook Login for Business).
- **Frontend**: Componente React interactuando con el SDK de Facebook (`FB.login`). Permite al agente otorgar los permisos `pages_show_list` y `pages_messaging`.
- **Selección de Página**: Tras el login, el backend retorna la lista de páginas disponibles. El agente selecciona una y el sistema suscribe automáticamente la página al Webhook del CRM y guarda el Page Access Token asociado al `Agent`.

### 2. Infraestructura de Webhooks
- Endpoint `GET /api/webhooks/facebook`: Validación inicial del token de desafío (`hub.verify_token`).
- Endpoint `POST /api/webhooks/facebook`: Recepción de eventos. Verifica la firma `X-Hub-Signature-256` utilizando el App Secret de Meta.

### 3. Enriquecimiento de Contactos
**`FacebookContextBuilder` y `FacebookProfileFetcher`**
Cuando llega un mensaje de un PSID (Page-Scoped ID) desconocido:
1. El sistema realiza una llamada a la Graph API (`/v21.0/{PSID}?fields=first_name,last_name,name`).
2. Requiere que la aplicación tenga el feature **"Business Asset User Profile Access"** aprobado.
3. Si la Graph API retorna los datos, se crea el Contacto con su nombre real.
4. **Fallback Limpio**: Si el usuario tiene privacidad estricta o falla la API, el contacto se crea como `Cliente FB` con apellido `FB-{últimos 6 dígitos del PSID}` para evitar bloqueos conversacionales.

### 4. Aislamiento FinOps y Tokens
Se estableció una distinción estricta de consumo de tokens entre la IA Personal (Copilot) y los canales de mensajería (WhatsApp/Facebook).
- Se añadió la propiedad `Channel` a la entidad `AgentDailyTokenUsage`.
- `AgentAiService` registra bajo el canal `Copilot`.
- `FacebookAiService` registra bajo el canal `Facebook`.
- En el frontend, `TokenUsageTable` es reusable y consulta dinámicamente `/api/finops/token-usage?channel=...` según la pestaña activa, garantizando que el agente visualice los costos aislados por canal.

## Interfaces Modificadas
- `ConfiguracionIntegracionIA.tsx`: Panel central de configuración rediseñado con pestañas limpias y un único botón global de "Guardar Configuración".
- `FacebookIntegracionTab.tsx`: Gestión visual del estado de conexión de la página de Meta.

## Siguientes Pasos (Fase 2)
- Refactorización de la entidad `Contacto` para soportar múltiples banderas de estado IA independientes (`Estado IA (WA)`, `Estado IA (FB)`).
- Modificación de la tabla `ContactDailyTokenUsage` para incluir `Channel` y permitir filtro de consumo directamente en el perfil del contacto.