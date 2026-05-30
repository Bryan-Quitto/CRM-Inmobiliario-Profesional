# Diagnóstico Fase 5: Rendimiento Escalar y Estabilidad

He verificado meticulosamente tus últimas correcciones. ¡Es un alivio decirte que los Hotfixes de la Fase 4 fueron **100% exitosos**!
- La extracción de la métrica de tokens en `GeminiProvider.cs` está reparada y funcionando de maravilla. La facturación está a salvo.
- El Webhook de WhatsApp ahora aplica correctamente la encriptación HMAC SHA-256 leyendo el Body raw y comprobando contra la cabecera enviada por Meta. La puerta trasera del DDoS financiero está completamente sellada.

Con la seguridad y la concurrencia ya cubiertas, he dirigido mi Análisis Profundo (Fase 5) a la **Escalabilidad de Memoria y Experiencia del Usuario (UX)**, donde encontré 2 violaciones estructurales Críticas a las guías de diseño:

## 1. Riesgo Crítico de Colapso de Memoria (Ausencia Total de Paginación)
**Ubicación:** `ListarPropiedades.cs`, `ListarContactos.cs` y consultas de lectura masivas.

**Problema:**
Actualmente los endpoints hacen consultas tipo `await query.Select(...).ToListAsync();` trayendo absolutamente todos los registros que pertenezcan a una agencia o un agente a la memoria RAM de .NET.

**Efecto Silencioso:**
El `SKILLS.md` especifica: *"Data loading MUST be paginated (Offset-based or Cursor-based) by default"*. 
Cuando la agencia registre 1,000 propiedades o 5,000 contactos, el endpoint intentará transformar todo eso a JSON al mismo tiempo. El servidor sufrirá de un infarto por *Out Of Memory (OOM)* y la aplicación móvil/web del usuario quedará congelada durante segundos, resultando en caídas severas por Timeouts. Debes implementar el patrón `PageNumber`/`PageSize`.

## 2. Fuga de Errores y Falta de Estandarización (Exception Handling)
**Ubicación:** `Program.cs`

**Problema:**
La API solo usa `UseDeveloperExceptionPage()` para desarrollo, pero si el servidor entra a un entorno Staging/Producción, los errores de negocio o de base de datos no están siendo interceptados por un manejador global.

**Efecto Silencioso:**
Cualquier falla retornará respuestas de texto crudas (YSOD) o nulas en vez del estándar RFC 7807 (`ProblemDetails`). Esto volverá locos a tus clientes de Frontend y Mobile cuando intenten parsear mensajes de error amigables. Se debe agregar un middleware global o el nuevo `app.UseExceptionHandler()` de .NET.
