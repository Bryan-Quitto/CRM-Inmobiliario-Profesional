# Política de Privacidad de Lúmina

**Fecha de última actualización:** 4 de julio de 2026

Lúmina ("nosotros", "nuestro", "la Plataforma") está comprometida con la protección de los datos personales. Esta Política de Privacidad describe cómo recopilamos, utilizamos, almacenamos y protegemos la información personal, en cumplimiento de la Ley Orgánica de Protección de Datos Personales (LOPDP) del Ecuador, el Reglamento General de Protección de Datos (GDPR) y otros estándares internacionales aplicables.

Esta política se aplica a todos los usuarios de nuestra plataforma de CRM Inmobiliario profesional (Software como Servicio), es decir, a los Agentes Inmobiliarios Independientes (en adelante, "Usuario" o "Agente"). La funcionalidad de "Agencias" dentro de la plataforma opera únicamente como un mecanismo de agrupación y colaboración (espacio de trabajo o equipo) para compartir propiedades, y no genera un vínculo contractual directo entre Lúmina y dichas franquicias o empresas.

## 1. Roles en el Tratamiento de Datos

En el contexto de nuestros servicios, existen dos roles claramente diferenciados:

*   **Lúmina como Responsable del Tratamiento:** Actuamos como Responsables respecto a los datos personales de nuestros Usuarios (agentes y representantes legales de agencias) necesarios para la prestación del servicio, gestión de cuentas y facturación.
*   **Lúmina como Encargado del Tratamiento:** Actuamos como Encargados respecto a los datos personales de los clientes finales (contactos, prospectos, y propietarios de inmuebles) introducidos o vinculados a la plataforma por el Usuario. El Agente actúa como el **Responsable del Tratamiento** de los datos de su propia cartera de clientes y es el único responsable de recabar el consentimiento lícito para su tratamiento, incluyendo su procesamiento mediante herramientas de Inteligencia Artificial (IA) y canales de comunicación como WhatsApp.

## 2. Datos que Recopilamos

### 2.1. Datos de los Usuarios (Agentes y Agencias)
Como Responsables del Tratamiento, recopilamos:
*   **Información de Identificación y Contacto:** Nombre, apellido, correo electrónico (ID vinculado a Supabase Auth), teléfono y dirección física.
*   **Datos de Personalización:** Foto de perfil del agente y logotipo de la agencia.
*   **Integraciones y Credenciales:** Identificadores para canales de comunicación (WhatsApp Phone Number ID, Facebook Page ID, Facebook Page Access Tokens).
*   **Configuración de Inteligencia Artificial:** Preferencias de modelos de lenguaje, indicaciones (prompts) personalizadas y claves de integración propias cuando aplique.
*   **Datos Técnicos y de Uso:** Suscripciones a notificaciones WebPush, logs de auditoría de seguridad y de interacciones con la IA, uso de tokens y métricas de desempeño del agente dentro del CRM.

### 2.2. Datos de los Clientes Finales (Contactos y Propietarios)
Como Encargados del Tratamiento, procesamos por cuenta del Agente:
*   **Información de Contacto:** Nombre, apellido, correo electrónico y número de teléfono.
*   **Identidad Digital:** Identificadores únicos en plataformas de mensajería (ej. Facebook Sender ID, número de WhatsApp).
*   **Comunicaciones:** Historial completo de conversaciones (vía WhatsApp y Facebook Messenger), interacciones registradas manualmente y notas del agente.
*   **Perfil Comercial:** Origen del contacto, estado en el embudo de ventas, propiedades de interés o en propiedad, historial de transacciones y cierres.

## 3. Uso de los Datos

Utilizamos la información recopilada con las siguientes finalidades:
*   Proveer, mantener y mejorar los servicios del CRM Lúmina.
*   Gestionar la autenticación segura y el acceso a la plataforma.
*   Facilitar la comunicación omnicanal entre los Agentes y sus clientes mediante integraciones oficiales de Meta (WhatsApp, Facebook Messenger).
*   Procesar consultas, mensajes e información comercial mediante servicios de Inteligencia Artificial para asistir a los agentes (clasificación, resúmenes, y respuestas automáticas).
*   Enviar notificaciones push relacionadas con la operatividad del sistema.
*   Cumplir con obligaciones legales y prevenir fraudes o usos indebidos de la plataforma.
*   Procesar, comprimir y optimizar los archivos multimedia (ej. conversión a formato WebP) subidos por el Agente para maximizar la eficiencia del almacenamiento y mejorar el rendimiento de la plataforma.

## 4. Subencargados del Tratamiento (Terceros)

Para proveer nuestro servicio, compartimos información de manera segura con proveedores externos estrictamente necesarios (Subencargados). Todos ellos cumplen con altos estándares de seguridad y protección de datos:

*   **Supabase:** Proveedor principal de autenticación (Auth) y alojamiento de base de datos (PostgreSQL). Alberga los datos de registro de agentes y la base de datos completa.
*   **Meta Platforms, Inc.:** Provee la infraestructura de WhatsApp Business API y Facebook Messenger para la recepción y envío de mensajes automatizados o manuales (vía Webhooks y Graph API).
*   **Servicios de Inteligencia Artificial (OpenAI, Google Gemini):** Empleados para el procesamiento de lenguaje natural (generación de texto, transcripciones con Whisper, embeddings). Cierta información de los contactos viaja a estas APIs para ser procesada exclusivamente para las funcionalidades del CRM.
*   **Servicios WebPush:** Para el enrutamiento de notificaciones al navegador del agente.

## 5. Almacenamiento Local

Lúmina utiliza tecnologías de almacenamiento en el navegador del usuario final (Agente) para el correcto funcionamiento de la aplicación web. La plataforma es una Aplicación de Página Única (SPA) que utiliza tokens JWT en cabeceras de autorización (`Bearer`), y **no emplea cookies de sesión**:

*   **LocalStorage:** Utilizamos `localStorage` para persistir la sesión de Supabase Auth (tokens JWT) de forma segura en el navegador, evitando reconexiones constantes.
*   **Caché de Aplicación (Zustand / SWR):** Ciertas preferencias de usuario y datos de la interfaz se almacenan temporalmente en la memoria o almacenamiento local/sesión para garantizar una experiencia rápida y fluida.
*   **Notificaciones Push Nativas (WebPush/VAPID):** El Agente puede habilitar notificaciones push del sistema operativo (Windows, Android, macOS, iOS) mediante la tecnología estándar Web Push con claves VAPID propias. Estas notificaciones alertan sobre tareas pendientes, vencidas y solicitudes de asistencia de la IA. Su activación es completamente voluntaria y configurable desde el panel de ajustes.

*Nota: Lúmina no utiliza cookies de sesión ni cookies de rastreo publicitario de terceros en su plataforma de software.*

## 6. Base Legal para el Tratamiento

*   **Para Usuarios (Agentes):** El tratamiento se basa en la ejecución del contrato de prestación de servicios (Términos de Servicio), el consentimiento expreso al crear una cuenta y el interés legítimo de mejorar nuestra plataforma.
*   **Para Clientes Finales:** Los Agentes actúan como Responsables y basan su tratamiento en el consentimiento de sus clientes o en la relación precontractual/contractual que mantienen con ellos.

## 7. Derechos de los Titulares de los Datos

De acuerdo con la LOPDP y el GDPR, los titulares de los datos tienen derecho a:
*   **Acceso:** Conocer qué datos personales tratamos.
*   **Rectificación y Actualización:** Corregir datos inexactos o incompletos.
*   **Eliminación (Olvido):** Solicitar el borrado de sus datos cuando ya no sean necesarios o se retire el consentimiento.
*   **Oposición y Limitación:** Oponerse a ciertos tratamientos o solicitar su restricción.
*   **Portabilidad:** Recibir sus datos en un formato estructurado y legible por máquina.

Los Usuarios pueden ejercer estos derechos directamente desde su panel de configuración o contactándonos a través de nuestros canales de soporte. Para el caso de clientes finales, deberán ejercer estos derechos directamente ante el Agente inmobiliario correspondiente; Lúmina asistirá técnicamente al Agente para cumplir con tales solicitudes.

## 8. Seguridad de los Datos

Implementamos medidas técnicas y organizativas robustas para proteger los datos contra accesos no autorizados, alteraciones, divulgaciones o destrucción. Esto incluye cifrado en tránsito (HTTPS/TLS), autenticación segura (JWT), control de acceso basado en roles (RLS) a nivel de base de datos en Supabase, y **cifrado en reposo** transparente (usando la **ASP.NET Core Data Protection API**) para salvaguardar información crítica como las claves de integración de terceros (API Keys de Inteligencia Artificial).

## 9. Datos de Plataformas Meta (WhatsApp y Facebook Messenger)

Cuando el Usuario vincula sus canales de WhatsApp Business o Facebook Messenger a la plataforma, Lúmina accede a los mensajes, metadatos de conversaciones y configuración de página exclusivamente para proveer las funcionalidades del CRM descritas en esta política. Lúmina declara expresamente que:

*   Los datos provenientes de plataformas de Meta **no son utilizados para publicidad** de ningún tipo, ni para crear perfiles comerciales propios de Lúmina ajenos a las funcionalidades del CRM.
*   Los datos de conversaciones de WhatsApp y Messenger son tratados únicamente para mostrar el historial en el CRM, automatizar respuestas en nombre del Agente y generar alertas de asistencia para el Agente.
*   El Agente (Usuario) es el único responsable de obtener el consentimiento leal y lícito de sus contactos para el uso de mensajería automatizada o asistida por IA, conforme a las Políticas de Negocio de Meta.
*   Lúmina opera bajo el modelo de Proveedor de Tecnología (Tech Provider / ISV) sobre cuentas de WhatsApp Business API gestionadas por los propios Agentes.

## 10. Menores de Edad

Lúmina es un servicio exclusivamente destinado a profesionales y empresas (B2B). No está dirigido a personas menores de 18 años. No recopilamos intencionalmente datos personales de menores. Si tuviesemos conocimiento de haber recopilado datos de un menor sin consentimiento parental válido, procederemos a su eliminación inmediata.

## 11. Retención de Datos

Conservamos los datos personales únicamente durante el tiempo estrictamente necesario para los fines para los que fueron recopilados:

| Tipo de Dato | Plazo de Retención |
|---|---|
| Datos de cuenta del Agente (perfil, credenciales) | Mientras la cuenta esté activa + 30 días tras eliminación |
| Contactos y propiedades (datos del cliente final) | Mientras el Agente mantenga activa su cuenta |
| Historial de conversaciones (WhatsApp / Messenger) | 12 meses desde la última interacción |
| Logs de IA y uso de tokens | 6 meses |
| Logs de auditoría de seguridad | 12 meses |
| Suscripciones WebPush | Hasta que el Agente las revoque o elimine su cuenta |

Una vez vencido el plazo, los datos son eliminados o anonimizados de forma segura. En el caso específico de las cuentas de Usuario (Agente), pasados los 30 días de su solicitud de eliminación, se aplica un borrado lógico y anonimización. Esto implica la eliminación definitiva de datos identificativos (nombre, teléfono, email, foto de perfil, etc.), quedando la cuenta como un "Agente Anónimo". Este proceso se realiza para preservar la integridad de las métricas históricas de la plataforma sin mantener información personal identificable.

## 12. Transferencias Internacionales

Dado que utilizamos infraestructura en la nube (como Supabase, OpenAI, Google y Meta), los datos pueden ser transferidos y procesados en servidores ubicados fuera de Ecuador (ej. Estados Unidos o la Unión Europea). Nos aseguramos de que estos proveedores ofrezcan garantías adecuadas de protección, como cláusulas contractuales tipo y certificaciones de cumplimiento de privacidad.

## 13. Cambios a la Política de Privacidad

Nos reservamos el derecho de actualizar esta política periódicamente. Los Usuarios serán notificados sobre cambios sustanciales mediante **notificaciones obligatorias dentro de la plataforma (in-app)** al iniciar sesión, requiriendo su aceptación explícita para continuar utilizando el servicio.

## 14. Contacto

Para dudas sobre esta Política de Privacidad o consultas legales respecto a la protección de datos, por favor contáctese con: `soporte@luminacrminmobiliario.com`.
