# 031 - AI Token Cost Breakdown & Cache Savings

## 1. Contexto y Objetivo
El CRM Inmobiliario Profesional, operando bajo una arquitectura Dual-Provider (OpenAI y Gemini), inyecta un super-prompt sustancial en las interacciones de IA (Context Caching). El objetivo es medir con precisión el desglose de consumo de tokens (Input Base, Input Cacheado y Output) y calcular dinámicamente el ahorro económico real en el Frontend. Esto permite educar al usuario de forma transparente sobre el valor agregado de la optimización del sistema.

## 2. Arquitectura de Backend (C# .NET 10 - Vertical Slice)
### Entidades y Base de Datos
- Modificación a la entidad principal: `ContactDailyTokenUsage.cs`.
- Se añadieron tres propiedades fundamentales: `InputTokens`, `CachedTokens` y `OutputTokens`.
- Migración aplicada estrictamente a través de EF Core CLI (`AddTokenBreakdownToContactDailyUsage`) sobre la base de datos Supabase, garantizando compatibilidad retroactiva.

### Feature Endpoint
- Modificación al Feature `ObtenerTokenUsageContacto.cs` (`/contactos/{id}/token-usage`).
- **Aplicación del One Trip Pattern**: La consulta LINQ fue optimizada para no realizar cargas en memoria. Se agruparon las operaciones de agregación mediante `Sum(x => x.TokensUsed)`, `Sum(x => x.InputTokens)`, `Sum(x => x.CachedTokens)` y `Sum(x => x.OutputTokens)` en una sola proyección hiper-eficiente ejecutada directamente en el motor SQL.

### Interceptores de Modelos de IA
- Inyectores como `OpenAiProvider` y `WhatsAppAiService` fueron modificados para escuchar e interceptar la "Usage Metadata" que envían los modelos al finalizar el proceso de streaming, mapeando esa información directamente a la base de datos.

## 3. Arquitectura de Frontend (React 19 - FSD)
### Entidad Compartida (AI Pricing)
- Se creó una capa limpia en `src/entities/ai-pricing/utils/calculateCost.ts` que encapsula la lógica matemática para desglosar el costo y previene fugas de lógica de negocio en la capa de vista.
- Detecta al proveedor dinámicamente (ej. prefijo `AIza` para Gemini, `sk-` para OpenAI) para aplicar sus respectivas tablas de precios con precisión comercial:
  - **OpenAI (gpt-4o-mini)**: Input $0.15/1M | Cached $0.075/1M | Output $0.60/1M
  - **Gemini (2.5 Flash)**: Input $0.30/1M | Cached $0.03/1M | Output $2.50/1M

### UI de Configuración (Estimación)
- El estimador financiero hardcodeado ($0.15 fijo) en `ConfiguracionIntegracionIA.tsx` fue reemplazado.
- Se implementó un **Estimador Optimizado** interactivo. Ahora asume de forma heurística una optimización agresiva por Context Caching (~85%) e incluye un Tooltip elegante que compara el "Costo Máximo Sin Caché" vs "Costo Optimizado", instruyendo al usuario sobre la rentabilidad antes de que consuma un solo token.

### Perfil del Contacto
- El componente `ContactoProfileCard.tsx` y su hook `useContactoTokenUsage.ts` soportan el desglose real provisto por el backend.
- Renderizan el ahorro a través de una UI Premium (World-Class UX) resaltando visualmente el porcentaje y la cantidad exacta de dólares ahorrados gracias a la caché de la plataforma.
