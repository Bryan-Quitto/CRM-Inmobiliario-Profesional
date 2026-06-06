# Llamadas a Funciones de IA (Function Callings)

Tras refactorizar el código base (`CRM_Inmobiliario.Api\Features\WhatsApp\Services\Prompts\AiToolDefinitions.cs`), las **10 funciones** ahora están estrictamente separadas por canales de ejecución para garantizar la seguridad y experiencia del usuario (WhatsApp para clientes vs Copilot para el agente interno).

---

## 🟢 Herramientas Compartidas (Disponibles para Ambas IAs)
Estas herramientas forman la funcionalidad principal y están disponibles tanto en WhatsApp como en el Copilot.

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

### 4. RegistrarInteresContacto
- **Descripción:** Registra formalmente el nivel de interés de un contacto por una propiedad específica (Alto, Medio, Bajo, Descartada) tras enviarle opciones o tras una visita.
- **Parámetros:**
  - `propiedadId` *(string, requerido)*: ID de la propiedad que generó el interés.
  - `nivelInteres` *(string, requerido)*: El nivel de interés (Alto, Medio, Bajo, Descartada).
  - `notas` *(string, opcional)*: Observaciones o feedback específico del cliente sobre esta propiedad.

---

## 📱 Herramientas Exclusivas de WhatsApp
Estas herramientas son exclusivas de la IA de cara al cliente final. No pueden ser invocadas por el Agente Interno.

### 5. SolicitarAsistenciaHumana
- **Descripción:** Apaga el bot y escala la conversación a un agente humano en caso de frustración o petición expresa.
- **Parámetros:**
  - `motivo` *(string, requerido)*: Razón detallada del escalamiento.

### 6. DerivarCaptacionPropietario
- **Descripción:** Se usa cuando el usuario quiere vender/alquilar su propia propiedad. Registra al usuario como "Propietario", finaliza la sesión automática (apaga el bot) y lo deriva al equipo de captación.
- **Parámetros:**
  - `nombre` *(string, requerido)*: Nombre completo del propietario.

---

## 👨‍💻 Herramientas Exclusivas del Agente Personal (Copilot)
Estas herramientas están diseñadas estrictamente para interactuar de forma profunda con la SPA y la administración del CRM. La IA de WhatsApp tiene prohibido acceder a estas acciones.

### 7. ResumirHistorialContacto
- **Descripción:** Consulta el historial completo (notas, tareas, mensajes) de un contacto.
- **Parámetros:**
  - `searchTerm` *(string, requerido)*: Nombre completo o teléfono del contacto.

### 8. CrearTareaCRM
- **Descripción:** Crea un recordatorio o cita en la agenda del agente.
- **Parámetros:**
  - `titulo` *(string, requerido)*, `descripcion` *(string, requerido)*, `fechaProgramada` *(string, requerido)*.
  - `contactoId`, `propiedadId` *(opcionales)*.

### 9. NavegacionDirecta
- **Descripción:** Redirige al agente internamente a una sección específica del SPA del sistema.
- **Parámetros:**
  - `destino` *(string, requerido)*: La ruta a redirigir (ej. `'/agendar-cita'`).

### 10. GenerarCotizacionRapida
- **Descripción:** Calcula la proyección hipotecaria y cuotas estimadas basándose en documentos corporativos internos.
- **Parámetros:**
  - `montoPropiedad` *(number, requerido)*: El precio total.
  - `enganche` *(number, requerido)*: Entrada inicial planeada.
