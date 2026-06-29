# Manual de Administración, Configuración y Seguridad

Este documento detalla las reglas de negocio, lógicas de validación y parametrizaciones del grupo de Administración, Configuración y Seguridad del CRM Inmobiliario Profesional.

## 1. Gestión de Agentes y Perfiles
El ciclo de vida de los agentes inmobiliarios está gestionado por flujos específicos en el sistema.
- **Invitación:** Los administradores pueden invitar a nuevos agentes al sistema (`InvitarAgente`).
"Los administradores tienen la opción de enviar una invitación a nuevos compañeros para que se unan al sistema, para ello se le debe proporcionar el correo al administrador."
- **Activación:** Los agentes invitados deben activar su cuenta para poder operar (`ActivarAgenteInvitado`).
"Si recibiste una invitación, debes activar tu cuenta usando el enlace proporcionado en tu correo para poder empezar a usar la plataforma."
- **Estados del Agente:** Un agente puede ser desactivado (`DesactivarAgente`) impidiendo su acceso, o reactivado (`ReactivarAgente`) para restaurar sus permisos.
"Los administradores pueden suspender el acceso de un agente en cualquier momento, y volver a dárselo cuando sea necesario."
- **Perfiles:** Los usuarios administran su información personal mediante flujos de obtención y actualización de perfil (`ObtenerPerfil`, `ActualizarPerfil`, `ActivarPerfil`).
"Cada usuario puede ver y modificar su información personal desde la sección de su perfil."

## 2. Configuración de IA y FinOps
El uso de Inteligencia Artificial está controlado y parametrizado para gestionar costos (FinOps).
- **Gestión de Configuración IA:** Se puede consultar y actualizar la configuración de IA a nivel global o de agencia (de agencia solo puede hacerlo el administrador) (`ObtenerConfiguracionIAEndpoint`, `ActualizarConfiguracionIAEndpoint`). Esto se puede hacer desde el panel de configuración en la opción IA y Límites.
"El sistema permite que cada agente utilice su propia IA con las limitaciones de ser de ChatGPT o Gemini, considerar que existen tres tipos de IAs en el sistema:

1. IA Personal: Es la IA integrada dentro de la plataforma, se la puede utilizar al pulsar en el icono de estrella de cuatro puntas, al lado de la campana, en el encabezado de la plataforma o al entrar en los detalles de un contacto al pulsar en 'Analizar con IA'

2. IA de WhatsApp: Es la IA integrada para responder automáticamente a los contactos de WhatsApp, para ver todas sus funciones puede ir al apartado (Acceso directo al manul de IA)

3. IA de Facebook: Es la IA integrada para responder automáticamente a los contactos de Facebook, para ver todas sus funciones puede ir al apartado (Acceso directo al manul de IA)

Ademas de esto, cada agente puede poner la personalidad que quiere que adopte la IA en el apartado de configuración en la pestaña 'Identidad'.

Finalmente, el administrador puede poner el contexto corporativo que pueda adquirir la IA en base a la agencia gestionada por el propio administrador"
- **Validación y Cuotas:** Las configuraciones se validan antes de aplicarse (`ValidarConfiguracionIAEndpoint`).
"El sistema verifica que los ajustes de IA ingresados sean correctos antes de guardarlos."
- **Tokens y Consumo:** Existe un control sobre el consumo de tokens diarios (`GetAgentTokenUsage`), para la IA de WhaysApp, Facebook y la IA personal del agente, este límite se reinicia diariamente y en el caso de las IAs de las redes sociales es POR CONTACTO, además hay un proceso para reiniciar estas cuotas de tokens (`ReiniciarTokensIAEndpoint`), el límite establecido lo puede poner en el panel de configuración en la opción IA y Límites, por defecto para todas las IAs esta en 100k, y el rango es de 20k a 1 millón de Tokens, considerar que para el contacto se debe de reiniciar desde la lista de contactos activando la IA para ese contacto específico.
"Cada agente puede establecer un límite de uso diario para la Inteligencia Artificial desde la pestaña de Configuración en el apartado 'IA y Límites', puede hacerlo para la IA de WhatsApp, Facebook y la Personal, considerando que por defecto son 100k tokens y el rango es de 20k a 1 millón de tokens. Si necesitas más capacidad puedes aumentar el límite o en caso de haberlo alcanzado se puede reiniciar este límite directamente desde la tarjeta del contacto o en caso de ser con la IA Personal se lo puede hacer desde la ventana del chat con la IA."

## 3. Administración Global y Seguridad
- **Re-Vectorización masiva:** El sistema cuenta con jobs en segundo plano (Hangfire) para re-vectorizar propiedades e integrarlas en búsquedas semánticas (requiere permisos de administrador `AdminPolicy`). Lo mismo aplica para la base documental corporativa. En el frontend, los administradores pueden disparar manualmente estos procesos (tanto para propiedades como para documentos) desde el panel de Configuración IA, eligiendo entre vectorizar solo los elementos faltantes o forzar una re-vectorización completa.
"Los administradores pueden pedirle al sistema que vuelva a analizar todas las propiedades y documentos para que las búsquedas inteligentes de la IA sean más precisas. Esto se puede hacer desde el panel de configuración en la pestaña 'IA y Vectorización'."
- **Configuraciones Personales por Agente:** Las políticas de autoarchivado de registros y preferencias de notificación son configuraciones individuales de cada agente, no parámetros globales de la agencia.
"Cada agente puede personalizar cómo y cuándo quiere recibir notificaciones, y cómo organizar el autoarchivado de sus contactos y propiedades, todo desde el panel de configuración en las pestañas 'Notificaciones' y 'Auto-archivado' respectivamente. Estas preferencias son únicas para cada agente."

## 4. Frontend (UI)
- Módulos `auth` y `configuracion` en el frontend proveen la interfaz para inicio de sesión, recuperación de credenciales y los paneles de control (hooks y componentes) necesarios para consumir las APIs descritas.
"La plataforma incluye pantallas fáciles de usar para iniciar sesión, recuperar tu contraseña si la olvidas, y paneles para configurar todas las opciones de tu cuenta."