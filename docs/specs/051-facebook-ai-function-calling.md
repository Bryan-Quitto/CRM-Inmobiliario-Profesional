# 051: Facebook AI Function Calling & CoreAi Refactoring

## 1. Objetivo
Habilitar la ejecución de herramientas (Function Calling) en el canal de Facebook Messenger (`FacebookAiService`), reutilizando las herramientas existentes de la Inteligencia Artificial que originalmente operaban de manera exclusiva para WhatsApp.

## 2. Decisiones Arquitectónicas

### 2.1 Desacoplamiento de Canales (Vertical Slice)
Las herramientas de la IA dejaron de pertenecer al feature de `WhatsApp` y se promovieron al feature compartido `CoreAi`.
- **Origen:** `Features\WhatsApp\Services\Tools`
- **Destino:** `Features\CoreAi\Tools`
- Se actualizaron las referencias en la inyección de dependencias (`Program.cs`) y orquestadores.

### 2.2 Reemplazo de `CustomerPhone` por `ContactoId`
En WhatsApp, el número telefónico es la llave natural primaria del cliente en la conversación. En Facebook Messenger, el `SenderId` (PSID) es anónimo y el cliente no cuenta con número telefónico inicial.
- **Antes:** Las consultas a base de datos en herramientas como `BuscarPropiedadesHandler`, `RegistrarInteresContactoHandler` y `DerivarCaptacionPropietarioHandler` dependían directamente del teléfono (`context.CustomerPhone`).
- **Ahora:** El orquestador de herramientas inyecta el `ContactoId` universal (Guid). Todas las consultas LINQ a Supabase priorizan el `ContactoId` (`context.Contactos.FindAsync(context.ContactoId.Value)`). El `CustomerPhone` se mantiene estrictamente como mecanismo de *fallback*.

### 2.3 Seguridad y Prevención de Fuga de Datos
Las herramientas ahora conocen a través de qué canal fueron invocadas (`context.Channel`).
En `ConsultarDetallesPropiedadHandler`, se implementó un escudo de privacidad: información altamente sensible como *Comisión Compartida* y *Agente Original de Captación* **solo** se inyectan en el prompt de la IA si `Channel == "Copilot"`. En `WhatsApp` y `Facebook`, esta data se censura.

## 3. Implementación del Orquestador (Facebook)

### 3.1 `FacebookAiLoopHelper`
Para cumplir la regla estricta del proyecto de **no exceder 200-250 líneas por archivo de feature**, se prohibió copiar el enorme bucle de ejecución de tools (ciclo `while`) que existía dentro de `WhatsAppAiService`.
En su lugar, se creó `FacebookAiLoopHelper.cs`:
- Contiene el bucle asíncrono para ejecutar la inferencia del modelo.
- Implementa el **Circuit Breaker**: Si la IA falla críticamente al formatear los argumentos JSON más de 3 veces, o si el ciclo de razonamiento excede las 5 iteraciones, corta la ejecución e invoca automáticamente la herramienta `SolicitarAsistenciaHumana`.
- Administra el contador de tokens acumulados (Input, Output, Cached).

## 4. Pruebas y Cobertura
Se completaron 32 pruebas unitarias (`xUnit`, `Moq`, `EF Core InMemory`), garantizando cobertura de los siguientes escenarios críticos:
1. `FacebookAiLoopHelper`: Bucle y circuitos de quiebre.
2. `ConsultarDetallesPropiedadHandler`: Fuga de datos condicionada por el canal.
3. `RegistrarInteresContactoHandler`: Guardado exitoso y validaciones.
4. `DerivarCaptacionPropietarioHandler`: Actualización del registro a `EsPropietario` usando `ContactoId`.
5. `SolicitarAsistenciaHumanaHandler`: Escalamiento y registro de notas en el CRM.

## 5. Reglas de Comportamiento de IA Consignadas
A nivel de *Prompt System* y código, se consolidaron estas reglas de negocio que aplican transversalmente:
- La IA **nunca** debe desperdiciar tokens saludando por su cuenta en el primer mensaje de la conversación. El backend maneja el saludo inyectando un encabezado pre-formateado.
- El pie de página con la opción humana siempre acompaña el primer mensaje.
- La IA siempre debe reemplazar alusiones genéricas ("el agente") usando la etiqueta de la variable `{agentName}` resuelta desde la BD.
