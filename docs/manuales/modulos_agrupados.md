# Mapa de Módulos Agrupados del Sistema: CRM Inmobiliario Profesional

Este documento agrupa lógicamente los módulos del sistema (Backend y Frontend) bajo temas principales para facilitar la extracción de reglas de negocio por parte de los agentes. Se proporcionan las rutas absolutas para agilizar la búsqueda de código.

## 1. Módulo de Inteligencia Artificial (IA / Copilot)
Agrupa toda la lógica relacionada a los asistentes, procesamiento de IA y agentes autónomos.
* **Backend:**
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario.Api\Features\AI`
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario.Api\Features\AgentAi`
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario.Api\Features\CoreAi`
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario.Api\Features\IA`
* **Frontend:**
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\features\ia`
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\features\copilot`

## 2. Módulo de Propiedades e Inventario
Gestión del catálogo de inmuebles, imágenes (galerías) y matching con intereses.
* **Backend:**
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario.Api\Features\Propiedades`
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario.Api\Features\SeccionesGaleria`
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario.Api\Features\Intereses`
* **Frontend:**
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\features\propiedades`

## 3. Módulo de Contactos y CRM
Gestión de leads, clientes y el histórico de interacciones.
* **Backend:**
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario.Api\Features\Contactos`
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario.Api\Features\Interacciones`
* **Frontend:**
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\features\contactos`

## 4. Módulo de Comunicaciones y Canales (Omnicanalidad)
Integración con canales externos para comunicación y notificaciones.
* **Backend:**
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario.Api\Features\WhatsApp`
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario.Api\Features\Facebook`
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario.Api\Features\PushNotifications`
* **Frontend:**
  * (No se detectó una carpeta feature independiente, su UI probablemente se integra en Contactos/Interacciones)

## 5. Módulo de Productividad y Organización
Herramientas para el día a día de los agentes inmobiliarios.
* **Backend:**
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario.Api\Features\Tareas`
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario.Api\Features\Calendario`
* **Frontend:**
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\features\tareas`
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\features\calendario`

## 6. Módulo de Analítica y Dashboard
Reportes, métricas y vista general del sistema.
* **Backend:**
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario.Api\Features\Analitica`
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario.Api\Features\Dashboard`
* **Frontend:**
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\features\analitica`
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\features\dashboard`

## 7. Módulo de Administración, Configuración y Seguridad
Autenticación, configuración global, gestión de asesores (agents) y operaciones financieras (FinOps).
* **Backend:**
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario.Api\Features\Admin`
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario.Api\Features\Agents`
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario.Api\Features\Configuracion`
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario.Api\Features\FinOps`
* **Frontend:**
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\features\auth`
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\features\configuracion`

## 8. Módulo de Base de Conocimiento Institucional
Información corporativa y preguntas frecuentes utilizadas por el sistema o la IA.
* **Backend:**
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario.Api\Features\CorporateKnowledge`
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario.Api\Features\Faqs`
* **Frontend:**
  * (Sin feature independiente detectado)

## 9. Búsqueda y Herramientas Transversales
Código compartido y barra de búsqueda unificada.
* **Backend:**
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario.Api\Features\Shared`
* **Frontend:**
  * `C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\features\omnisearch`
