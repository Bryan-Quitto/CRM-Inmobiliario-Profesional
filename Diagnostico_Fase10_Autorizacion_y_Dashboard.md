# Diagnóstico Fase 10: Autorización por Defecto y Fugas de PII

He verificado tus implementaciones de la Fase 9:
- La protección de `Magic Numbers` en `SubirImagenPropiedad.cs` es perfecta. Los binarios maliciosos disfrazados rebotarán en la puerta.
- El umbral vectorial (`< 0.25`) en pgvector asegura que tu IA prefiera decir "No encontré propiedades" antes que alucinar e inventarse locales comerciales como si fueran casas de playa.

Para esta **Fase 10 (Penúltima fase de blindaje)**, concentré mi escrutinio en el archivo raíz, el corazón del servidor: `Program.cs`. Encontré 2 problemas críticos que comprometen la autorización fundamental y podrían exponer datos sensibles (PII) de tus clientes al internet público:

## 1. Autorización Abierta por Defecto (Fail-Open Middleware)
**Ubicación:** `Program.cs` (Middleware de agentes inactivos - L119)

**Problema:**
Cuando el middleware busca a un agente en la base de datos para saber si está activo, tienes esta lógica:
`isActivoVal = isActivo.HasValue ? isActivo.Value : true;`
Si el `AgentId` del JWT no existe en la tabla de `Agents` (porque fue borrado o es un usuario externo de Supabase), `isActivo` no tiene valor. Al no tener valor, tu código le asigna `true` por defecto.

**Efecto Silencioso:**
Un agente que ha sido borrado de la base de datos (pero su cuenta de Supabase Auth sigue viva), o cualquier atacante que logre registrarse directamente en el backend de Supabase, **será tratado como Agente Activo y tendrá acceso libre a tu API**. 
En ciberseguridad, la regla de oro es "Fail-Closed" (Denegar por defecto). Esa línea debe ser obligatoriamente: 
`isActivoVal = isActivo.HasValue ? isActivo.Value : false;`

## 2. Exposición Pública de Datos Sensibles (Insecure Hangfire Dashboard)
**Ubicación:** `Program.cs` (L137)

**Problema:**
Estás activando el panel de control de tareas en segundo plano usando simplemente:
`app.UseHangfireDashboard("/hangfire");`
Sin proveer ningún filtro de autorización (`IDashboardAuthorizationFilter`).

**Efecto Silencioso:**
Por defecto, Hangfire restringe el acceso a peticiones "locales" (`localhost`). Sin embargo, en despliegues modernos, tu API probablemente corra detrás de un balanceador de carga o un Reverse Proxy (Nginx, Docker Ingress, AWS ALB). Si el Proxy no transmite bien las cabeceras `X-Forwarded-For`, Hangfire creerá que **todas** las peticiones vienen de `localhost`.
¿El resultado? Cualquier persona en internet podrá acceder a `tuservidor.com/hangfire`. Ahí, podrán ver en texto plano los **números de teléfono de WhatsApp y los mensajes de tus clientes** (ya que se pasan como argumentos a los Jobs), además de poder borrar y repetir trabajos a placer.
Debes proteger este endpoint inyectando un filtro que exija que el usuario tenga un JWT válido y el `Rol == "Admin"`.
