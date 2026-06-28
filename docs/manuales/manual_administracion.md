# Manual de Administración, Configuración y Seguridad

Este documento detalla las reglas de negocio, lógicas de validación y parametrizaciones del grupo de Administración, Configuración y Seguridad del CRM Inmobiliario Profesional.

## 1. Gestión de Agentes y Perfiles
El ciclo de vida de los agentes inmobiliarios está gestionado por flujos específicos en el sistema.
- **Invitación:** Los administradores pueden invitar a nuevos agentes al sistema (`InvitarAgente`).
- **Activación:** Los agentes invitados deben activar su cuenta para poder operar (`ActivarAgenteInvitado`).
- **Estados del Agente:** Un agente puede ser desactivado (`DesactivarAgente`) impidiendo su acceso, o reactivado (`ReactivarAgente`) para restaurar sus permisos.
- **Perfiles:** Los usuarios administran su información personal mediante flujos de obtención y actualización de perfil (`ObtenerPerfil`, `ActualizarPerfil`, `ActivarPerfil`).

## 2. Configuración de IA y FinOps
El uso de Inteligencia Artificial está controlado y parametrizado para gestionar costos (FinOps).
- **Gestión de Configuración IA:** Se puede consultar y actualizar la configuración de IA a nivel global o de agencia (de agencia solo puede hacerlo el administrador) (`ObtenerConfiguracionIAEndpoint`, `ActualizarConfiguracionIAEndpoint`). Esto se puede hacer desde el panel de configuración en la opción IA y Límites.
- **Validación y Cuotas:** Las configuraciones se validan antes de aplicarse (`ValidarConfiguracionIAEndpoint`).
- **Tokens y Consumo:** Existe un control sobre el consumo de tokens diarios (`GetAgentTokenUsage`), para la IA de WhaysApp, Facebook y la IA personal del agente, este límite se reinicia diariamente y en el caso de las IAs de las redes sociales es POR CONTACTO, además hay un proceso para reiniciar estas cuotas de tokens (`ReiniciarTokensIAEndpoint`), el límite establecido lo puede poner en el panel de configuración en la opción IA y Límites, por defecto para todas las IAs esta en 100k, y el rango es de 20k a 1 millón de Tokens, considerar que para el contacto se debe de reiniciar desde la lista de contactos activando la IA para ese contacto específico.

## 3. Administración Global y Seguridad
- **Re-Vectorización masiva:** El sistema cuenta con jobs en segundo plano (Hangfire) para re-vectorizar propiedades e integrarlas en búsquedas semánticas (requiere permisos de administrador `AdminPolicy`). Lo mismo aplica para la base documental corporativa. En el frontend, los administradores pueden disparar manualmente estos procesos (tanto para propiedades como para documentos) desde el panel de Configuración IA, eligiendo entre vectorizar solo los elementos faltantes o forzar una re-vectorización completa.
- **API Keys:** Se administran las credenciales seguras para integraciones de terceros (`AdminApiKeys`).
- **Configuraciones Personales por Agente:** Las políticas de autoarchivado de registros y preferencias de notificación son configuraciones individuales de cada agente, no parámetros globales de la agencia.

## 4. Frontend (UI)
- Módulos `auth` y `configuracion` en el frontend proveen la interfaz para inicio de sesión, recuperación de credenciales y los paneles de control (hooks y componentes) necesarios para consumir las APIs descritas.
