# Llamadas a Funciones de IA (Function Callings)

Tras refactorizar el código base, las **10 funciones** ahora están estrictamente separadas por canales de ejecución para garantizar la seguridad y experiencia del usuario. Actualmente el proyecto cuenta con **3 IAs**:
1. IA de Facebook (para clientes)
2. IA de WhatsApp (para clientes)
3. IA personal del agente (Copilot)

---

## 🟢 Herramientas Compartidas (Disponibles para las 3 IAs)
Estas herramientas forman la funcionalidad principal y están disponibles tanto en los canales de clientes (Facebook y WhatsApp) como en el Copilot del agente.

### 1. BuscarPropiedades
- **Descripción:** Busca inmuebles utilizando búsqueda semántica según las especificaciones del cliente.
- **Parámetros:**
  - `query` *(string, requerido)*: Intención de búsqueda en lenguaje natural.
  - `tipoOperacion`, `presupuestoMaximo`, `habitacionesMinimas`, `antiguedadMaxima` *(opcionales)*.

### 2. ConsultarDetallesPropiedad
- **Descripción:** Consulta detalles profundos de una propiedad específica.
- **Parámetros:**
  - `propiedadId` *(string, requerido)*: El ID único (Guid) de la propiedad.

### 3. ConsultarBaseConocimiento
- **Descripción dinámica:** 
  - *Para WhatsApp:* Consulta los documentos y políticas corporativas **públicas**.
  - *Para Copilot:* Consulta documentos y políticas **públicas e internas**.
- **Parámetros:**
  - `query` *(string, requerido)*: Pregunta corporativa o de proceso.

---

## 📱 Herramientas Exclusivas de Clientes (WhatsApp y Facebook)
Estas herramientas son exclusivas de las IAs de cara al cliente final (Facebook y WhatsApp comparten en teoría las mismas capacidades). No pueden ser invocadas por el Agente Interno.

### 4. RegistrarInteresContacto
- **Descripción:** Registra formalmente el nivel de interés de un contacto por una propiedad específica (Alto, Medio, Bajo, Descartada) tras enviarle opciones o tras una visita.
- **Parámetros:**
  - `propiedadId` *(string, requerido)*: ID de la propiedad que generó el interés.
  - `nivelInteres` *(string, requerido)*: El nivel de interés (Alto, Medio, Bajo, Descartada).
  - `notas` *(string, opcional)*: Observaciones o feedback específico del cliente sobre esta propiedad.

### 5. SolicitarAsistenciaHumana
- **Descripción:** Apaga el bot y escala la conversación a un agente humano en caso de frustración o petición expresa.
- **Parámetros:**
  - `motivo` *(string, requerido)*: Razón detallada del escalamiento.

### 6. DerivarCaptacionPropietario
- **Descripción:** Se usa cuando el usuario quiere vender/alquilar su propia propiedad. Registra al usuario como "Propietario", finaliza la sesión automática (apaga el bot) y lo deriva al equipo de captación.
- **Parámetros:**
  - `nombre` *(string, requerido)*: Nombre completo del propietario.

### 7. EnviarFotosSeccionPropiedad
- **Descripción:** Envía al cliente la galería de fotos de una sección específica de una propiedad utilizando paginación.
- **Parámetros:**
  - `propiedadId` *(string, requerido)*: ID de la propiedad.
  - `nombreSeccion` *(string, requerido)*: Título de la sección de la galería (ej. Sala, Cocina).
  - `enviarTodas` *(bool, opcional, default false)*: Si es true despacha las imágenes; si es false recupera los pies de foto para tomar una decisión.
  - `offset` *(int, opcional, default 0)*: Elementos a omitir para la paginación (límite de 7 imágenes por envío).

---

## 👨‍💻 Herramientas Exclusivas del Agente Personal (Copilot)
Estas herramientas están diseñadas estrictamente para interactuar de forma profunda con la SPA y la administración del CRM. Las IAs de clientes (Facebook y WhatsApp) tienen prohibido acceder a estas acciones.

### 8. ResumirHistorialContacto
- **Descripción:** Consulta el historial completo (notas, tareas, mensajes) de un contacto.
- **Parámetros:**
  - `searchTerm` *(string, requerido)*: Nombre completo o teléfono del contacto.

### 9. CrearTareaCRM
- **Descripción:** Crea un recordatorio o cita en la agenda del agente.
- **Parámetros:**
  - `titulo` *(string, requerido)*, `descripcion` *(string, requerido)*, `fechaProgramada` *(string, requerido)*.
  - `contactoId`, `propiedadId` *(opcionales)*.

### 10. GenerarCotizacionRapida
- **Descripción:** Calcula la proyección hipotecaria y cuotas estimadas basándose en documentos corporativos internos.
- **Parámetros:**
  - `montoPropiedad` *(number, requerido)*: El precio total.
  - `enganche` *(number, requerido)*: Entrada inicial planeada.
  - `tasaInteresAnual` *(number, requerido)*: Tasa de interés anual (ej. 8.5).
  - `plazosMeses` *(array de enteros, requerido)*: Plazos de financiamiento en meses (ej. [180]).

---

## 🔗 Navegación Interna (Convención de Links — sin tool)

La navegación interna **no usa function calling**. El Copilot incluye links Markdown en su respuesta y el frontend los intercepta con React Router.

- **Formato:** `[emoji Descripción](ruta)` — ej. `[📅 Ir al Calendario](/calendario)`
- **Ventaja:** $0 tokens extra vs. la antigua tool `NavegacionDirecta` (eliminada).
- **Rutas soportadas:** `/`, `/calendario`, `/contactos`, `/propiedades`, `/kpis`, `/configuracion/perfil`, `/configuracion/ia`, `/ia-logs/whatsapp`.
- **Rutas dinámicas:** La IA resuelve el ID con `ResumirHistorialContacto` y construye el link completo, ej. `/contactos/uuid`.
- **Interceptor:** `ChatMessageItem.tsx` → renderer custom del componente `a` de `ReactMarkdown`.
