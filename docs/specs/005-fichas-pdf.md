# Spec 005: Generación de Fichas Técnicas en PDF

## Contexto y Objetivo
El CRM requiere la capacidad de exportar la información detallada de una propiedad en un formato PDF profesional (A4). Este documento servirá para compartir por WhatsApp, Email o imprimir para entregas presenciales.

## 1. Evaluación de Arquitectura
**Recomendación: Generación en el Cliente (@react-pdf/renderer)**

### Justificación:
- **Zero Latency:** La generación es instantánea desde el navegador sin esperar una respuesta del servidor.
- **Visualización:** Permite previsualizar el PDF en un modal antes de descargarlo.
- **Reducción de Costes:** No consume CPU ni memoria en el servidor (un proceso pesado para PDFs).
- **Manejo de Assets:** Las imágenes de Supabase Storage se pueden renderizar directamente desde las URLs que el cliente ya tiene en caché.
- **Layout Declarativo:** Se usa una sintaxis similar a React/CSS para el diseño, facilitando mantenibilidad.

## 2. Estructura de Datos y Sincronización (COMPLETADO)

### Datos de la Propiedad:
El endpoint `GET /api/propiedades/{id}` ya proporciona:
- Título, Descripción, Precio, Ubicación (Dirección, Sector, Ciudad).
- Detalles técnicos: Habitaciones, Baños, Área Total.
- Colección de Media (URLs públicas, orden y marca de foto principal).

### Datos del Agente (Footer):
**ESTADO: Implementado.**
- El módulo de Perfil ya permite gestionar: Nombre, Apellido, Teléfono, Agencia y **Foto de Perfil**.
- El hook `usePerfil` en el frontend ya centraliza esta información con cache SWR, garantizando disponibilidad inmediata para el generador de PDF.

## 3. Diseño Visual (Layout A4)

La ficha seguirá un estándar de "Alto Impacto Visual":

1.  **Cabecera (Header):**
    - Logo de la inmobiliaria (izquierda).
    - Título de la propiedad y referencia ID (derecha).
    - Línea divisoria elegante en color corporativo.
2.  **Hero Image:**
    - La imagen marcada como `EsPrincipal` ocupará el 40% superior de la página (Full Width).
3.  **Cuerpo (Body):**
    - **Grid de Detalles:** Una fila con iconos minimalistas indicando Habitaciones, Baños, Área y Precio destacado.
    - **Descripción:** Bloque de texto justificado con la descripción comercial.
    - **Galería Secundaria:** Grid de 2x2 o 3x1 con las fotos siguientes en el orden establecido.
4.  **Pie de Página (Footer):**
    - Fondo de color suave para destacar el contacto.
    - **Contacto Visual:** Foto de perfil del agente (circular, izquierda).
    - **Información:** Nombre completo, Agencia y teléfono/WhatsApp destacados.
    - **Call to Action:** *"¿Te interesa esta propiedad? Contáctame para agendar una visita."*

## 4. Flujo de Usuario (UX)

- **Ubicación:** Botón con icono de PDF y texto "Descargar Ficha" en la barra de acciones de `PropiedadDetalle.tsx`.
- **Estado de Carga:** 
    - Mientras se genera el blob del PDF, el botón mostrará un spinner y el texto "Generando...".
    - El tiempo estimado de generación es < 500ms.
- **Confirmación:** Una vez listo, se dispara la descarga automática del navegador con el nombre `Ficha-[Titulo-Propiedad].pdf`.

## 5. Tareas Técnicas (Próximos Pasos)

1.  **Frontend:** Instalar `@react-pdf/renderer`.
2.  **Frontend:** Crear componente `PropiedadFichaPDF.tsx` con el layout definido (integrando `usePerfil`).
3.  **UI:** Integrar botón de descarga en la vista de detalle de propiedad.
4.  **Validación:** Probar renderizado de imágenes externas (Supabase) en el PDF.
