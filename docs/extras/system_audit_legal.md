# Auditoría Técnica del Sistema - Resumen Legal

Este documento contiene un resumen de la auditoría técnica realizada sobre el código del proyecto "CRM Inmobiliario Profesional" (backend y frontend). Su propósito es servir de base para la redacción de la Política de Privacidad y los Términos de Servicio del CRM B2B SaaS.

## 1. Datos Personales Recopilados

### De los Usuarios Directos (Agentes y Agencias)
Al registrarse y utilizar la plataforma, recopilamos los siguientes datos del usuario:
* **Información Básica e Identificación:** Nombre, apellido, correo electrónico (ID único vinculado a Supabase Auth), teléfono y dirección física.
* **Personalización y Multimedia:** Foto de perfil del agente y logotipo de la agencia.
* **Integraciones de Redes Sociales:** Identificadores para canales de comunicación, tales como *WhatsApp Phone Number ID*, *Facebook Page ID*, y tokens de acceso de páginas de Facebook (*Facebook Page Access Token*).
* **Configuración de Inteligencia Artificial:** Opciones de LLM, *prompts* personalizados e incluso claves de API propias si se activa la modalidad *Bring Your Own Key* (BYOK).
* **Datos del Dispositivo y Uso:** Suscripciones a Notificaciones Push Web, historial de acceso/acciones (logs de auditoría de seguridad y de IA), uso de tokens diarios, y métricas de desempeño del agente.

### De los Clientes Finales (Contactos, Prospectos y Propietarios)
Los agentes ingresan o el sistema captura automáticamente (vía integraciones) la siguiente información de terceros:
* **Información de Contacto:** Nombre, apellido, correo electrónico y número de teléfono.
* **Identidad en Redes Sociales:** Identificadores únicos de remitentes de plataformas de mensajería (ej. *Facebook Sender ID*, número de WhatsApp).
* **Comunicaciones e Interacciones:** Registro completo de conversaciones (mensajes de WhatsApp y Facebook Messenger), además de las interacciones manuales registradas en el CRM y notas libres dejadas por el agente.
* **Perfil Comercial:** Origen del contacto, estado dentro del embudo de ventas, propiedades de interés, propiedades en su poder (propietarios), historial de transacciones, reservas y cierres.

---

## 2. Integraciones de Terceros (Subencargados de Tratamiento / Processors)

El sistema se apoya en servicios externos para su funcionamiento. Estos actúan como procesadores de datos de los cuales debemos informar a los usuarios:

* **Supabase:** Utilizado como proveedor principal de **Autenticación e Identidad (Auth)** y para el **Alojamiento de la Base de Datos (PostgreSQL)**. Los datos de registro de agentes y la base de datos completa de contactos residen en su infraestructura.
* **Meta (Facebook, Instagram y WhatsApp Business API):** Empleado para la recepción y envío de mensajes automatizados o manuales. El CRM recibe Webhooks con información de clientes y mensajes, e interactúa con la Graph API.
* **Servicios de Inteligencia Artificial (OpenAI y Google Gemini):** El sistema utiliza modelos de lenguaje (ej. GPT-4o-mini, Gemini 2.5 Flash, embeddings, y Whisper) para asistir en las respuestas a clientes y clasificar información. Cierta información de los contactos viaja a las APIs de estos proveedores para ser procesada.
* **WebPush:** Servicios de terceros para el enrutamiento y envío de notificaciones push a los navegadores web de los agentes (almacenando *Push Subscriptions* en base de datos).

---

## 3. Métodos de Almacenamiento Local y Cookies

En el frontend (aplicación web) se emplean técnicas de almacenamiento en el navegador del usuario final (Agente) para el correcto funcionamiento de la plataforma:

* **LocalStorage para Sesiones (Supabase Auth):** El SDK de `@supabase/supabase-js` está explícitamente configurado con `persistSession: true`. Esto guarda de forma segura el *token JWT* de autenticación (por ejemplo, bajo la clave `sb-<project-ref>-auth-token`) en el **localStorage** del navegador.
* **Estado de la Aplicación (Zustand / SWR):** Dependiendo de la configuración de la caché de la aplicación en React, algunas preferencias de usuario, estados de UI o caché de datos pueden ser almacenados temporalmente en memoria o en *localStorage/sessionStorage* para mejorar la velocidad y la experiencia de usuario.
* **Cookies de Autenticación de Terceros:** Supabase u otros servicios integrados pueden establecer cookies estrictamente necesarias de tipo "First-party" para el manejo de sesiones de red o mitigación de ataques CSRF.

---

**Nota Legal Recomendada:** Es importante especificar que la plataforma (SaaS) opera como **Encargado del Tratamiento (Data Processor)** respecto a los datos de los *Contactos/Clientes Finales*, mientras que los *Agentes/Agencias* son los **Responsables del Tratamiento (Data Controllers)** y deben contar con el consentimiento adecuado de sus clientes para ingresar o enlazar su información con los servicios de IA o WhatsApp del CRM.
