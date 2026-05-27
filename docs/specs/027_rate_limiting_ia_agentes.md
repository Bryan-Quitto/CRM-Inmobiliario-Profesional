# Spec 027: Rate Limiting y Control de Consumo de IA por Agente

## 1. Objetivo
Permitir a los agentes inmobiliarios gestionar y limitar el consumo diario de tokens de la Inteligencia Artificial (OpenAI) a nivel individual por contacto (BYOK - Bring Your Own Key). Esto protege la cuota de facturación de cada agente frente a abusos o conversaciones interminables en WhatsApp.

## 2. Requerimientos Funcionales
- **Autogestión (Self-Service):** Cada agente puede establecer su propio límite diario de tokens por contacto desde el panel `/configuracion/uso-ia`.
- **Rango Permitido:** El límite debe estar restringido entre 20,000 y 1,000,000 de tokens por día.
- **Mecanismo de Bloqueo (Zero-Cron):** El sistema backend evalúa el consumo acumulado en tiempo real durante cada interacción de WhatsApp. Si el contacto supera el límite establecido por su agente, la IA se apaga automáticamente (`BotActivo = false`) y el contacto pasa a tener el estado de restricción (`EstadoIA = "LimiteAlcanzado"`).
- **Notificación Automática:** Una vez alcanzado el límite, si el usuario vuelve a enviar un mensaje, el sistema debe responder con un mensaje automatizado indicando que su caso ha sido transferido a un humano.
- **Mecanismo de Reseteo (Override):** El agente puede perdonar la restricción. Al activar nuevamente el switch de la IA en la interfaz gráfica, se mostrará un Modal de Confirmación. Si el agente aprueba, el sistema llama a un endpoint atómico que resetea los tokens consumidos del día a 0 y borra el `EstadoIA`.

## 3. Decisiones Arquitectónicas
- **Desacoplamiento de Estados:** Los estados de la IA (`Operativo`, `Límite de Tokens`, `Escalado a Humano`, `Desactivado`) NO DEBEN sobrescribir ni mezclarse con las "Etapas del Embudo Comercial" del CRM (ej. *En Negociación*). El campo `EstadoIA` vive en una propiedad de la base de datos totalmente independiente.
- **Zona Horaria:** Todo cálculo de reseteo automático de final de día debe operar estrictamente bajo la zona horaria de Ecuador (`UTC-5`).
- **Defensa del Pool de Conexiones:** Cualquier consulta concurrente de permisos o estados (ej. middleware `isActivo`) debe estar obligatoriamente cacheada en RAM (`IMemoryCache` de .NET) para prevenir ataques de agotamiento contra el Pool de Conexiones de Supabase (PostgreSQL).
- **Programación Defensiva en Herramientas IA:** Las herramientas (Functions) llamadas por el LLM deben validar obligatoriamente la existencia de Foreign Keys (ej. `PropiedadId`) antes de operar en la Base de Datos para mitigar el riesgo de alucinaciones.

## 4. Estructura de Datos
- **Entidad `Agent`:** Se añade `DailyTokenLimitPerContact` (int).
- **Entidad `Contacto`:** Se añade `EstadoIA` (string nullable).
- **Entidad `ContactDailyTokenUsage`:** Tabla transaccional para acumular consumos. Primary Key compuesta lógicamente por `ContactoId` + `Date` (Normalizada a UTC-5). Contiene `TokensUsed` (int).

## 5. UI/UX
- Eliminación total de estados "Escalado" y "Límite IA" del menú desplegable principal (Etapa) en FSD.
- Badge informativo de solo lectura anclado visualmente debajo o al lado de los estados principales del cliente y del propietario.
- Implementación estricta de modales interceptores (`ConfirmModal`) en el Toggle principal del perfil del contacto.
