# Spec 006: Evolución a Galería Estructurada y Dinámica

## Contexto y Objetivo
Transformar la galería plana actual de las propiedades en un sistema de secciones dinámicas (ej: Baños, Dormitorios, Áreas Sociales). El objetivo es permitir una narrativa visual organizada manteniendo todos los estándares de rendimiento "Ultra-Premium" implementados hasta ahora.

## 1. Modelo de Datos (Backend)

### Nueva Entidad: `PropertyGallerySection`
- `Id`: Guid (PK)
- `PropiedadId`: Guid (FK -> Properties)
- `Nombre`: string (max 100) - Ej: "Baños", "Cocina"
- `Orden`: int (para ordenar las secciones)
- `FechaCreacion`: DateTimeOffset

### Modificación: `PropertyMedia`
- `SectionId`: Guid? (FK -> PropertyGallerySection, Opcional)
- `Descripcion`: string? (max 500) - Para notas específicas de la foto.
- **Relación:** Si `SectionId` es NULL, la imagen pertenece a la "Galería Principal".

## 2. Experiencia de Usuario (Frontend)

Se mantendrán e integrarán los siguientes patrones en cada sección:

### Componente Reutilizable: `SectionalGallery.tsx`
Se extraerá la lógica actual de `PropiedadDetalle.tsx` a un componente autónomo que soporte:
- **Subida en Segundo Plano:** Uso de `UploadContext` para no bloquear la navegación.
- **Selección Múltiple:** Acciones en lote (borrar, descargar) por sección.
- **Descarga Masiva (ZIP):** Integración con `jszip` para descargar selecciones por sección o secciones completas en un único archivo.
- **Optimistic UI + Undo:** Al eliminar una sección o foto, se mostrará el toast de "Deshacer" (5s) antes de ejecutar el borrado real.
- **Drag & Drop:** Reordenamiento de fotos dentro de la sección y, opcionalmente, entre secciones.
- **Sistema de Portada:** Capacidad de marcar cualquier imagen (independientemente de su sección) como foto principal de la propiedad.
- **Indicadores de Sincronización:** Feedback visual global mientras SWR valida cambios en las secciones.

### Gestión de Secciones
- Botón "Añadir Sección" que abre un pequeño prompt para el nombre.
- Cada sección tendrá su propio botón de "Eliminar Sección" (con confirmación y limpieza de fotos).
- Botón global "Limpiar Todo" que ahora incluirá todas las secciones dinámicas.

## 3. Lógica de Sincronización y Limpieza

### Cambio de Estado (Cerrado/Inactivo)
- La lógica existente en el backend que limpia las imágenes se extenderá para:
    1. Identificar todas las secciones de la propiedad.
    2. Identificar todos los archivos en el Storage asociados a esas secciones.
    3. Ejecutar un borrado en cascada: Storage -> Media -> Secciones.

### Borrado de Sección
- Al eliminar una sección, se disparará automáticamente el borrado de todas las `PropertyMedia` asociadas, incluyendo sus archivos físicos en Supabase Storage.

## 4. Tareas Técnicas (Roadmap)

1.  **Backend:** Crear migración para `PropertyGallerySection` y actualizar `PropertyMedia`.
2.  **Backend:** Refactorizar endpoints de `Listar`, `Eliminar` y `ActualizarEstado` para contemplar las secciones (borrado recursivo).
3.  **Frontend (Refactor):** Crear `GalleryCore` (hook y componentes base) extrayendo la lógica actual de selección, descarga ZIP y subida.
4.  **Frontend (UI):** Implementar el orquestador de secciones en la vista de detalle.
5.  **Validación:** Asegurar que el "Batch Upload" funciona simultáneamente en múltiples secciones.

## 5. Consideraciones de Rendimiento
- Se seguirá usando SWR con persistencia local para que las secciones se carguen instantáneamente al volver a entrar en una propiedad.
- Las descripciones de las fotos se guardarán mediante el patrón de "Guardado Silencioso" (debouncing) para evitar botones de guardar individuales.
- El empaquetado ZIP se realizará en el cliente para no sobrecargar el servidor.
