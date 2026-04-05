# Spec 005: Generación de Fichas Técnicas PDF World-Class

## Contexto y Estado Actual
El CRM ha evolucionado de una galería plana a un sistema de **Narrativa Visual Estructurada**. Ya contamos con la infraestructura de base de datos y API necesaria para generar documentos profesionales de alto impacto.

## 1. Requerimientos de Datos (Listos)
Para el PDF utilizaremos los nuevos campos implementados en la Fase de Galería y Perfil:
- **Branding Agente:** `FotoUrl` (Perfil) y `LogoUrl` (Agencia) desde la entidad `Agent`.
- **Estructura Propiedad:** Título, Precio, Datos técnicos (Hab, Baños, m²) y el nuevo sistema de `GallerySections`.
- **Contenido Narrativo:** `Descripcion` de la sección y `Descripcion` (pie de foto) de cada imagen.

## 2. Diseño y Estética
El PDF debe seguir la estética "World-Class" del CRM:
- **Header:** Logo de la agencia a la izquierda, ID de propiedad y estado a la derecha.
- **Hero:** Foto de portada en gran formato.
- **Cuerpo:** 
    - Bloque de información técnica con iconos (Lucide-style).
    - Secciones dinámicas: Título de sección -> Descripción de sección -> Grid de fotos de esa sección.
    - Cada foto debe incluir su pie de foto si existe.
- **Footer:** Información del agente, su foto de perfil circular y datos de contacto/WhatsApp.

## 3. Arquitectura Técnica (Planificada)
- **Tecnología:** Uso de `jspdf` y `html2canvas` en el frontend para una generación instantánea sin carga adicional en el servidor .NET.
- **Optimización:** Las imágenes se procesarán mediante las URLs públicas de Supabase. 
- **Flujo:** Botón "Generar Ficha" en `PropiedadDetalle.tsx` que abre una previsualización antes de la descarga.

## 4. Notas de Implementación para el Próximo Agente
- **Query:** Utilizar el endpoint `GET /api/propiedades/{id}`. Este ya viene con `.AsSplitQuery()` para manejar eficientemente las secciones y fotos.
- **Tipos:** Usar las interfaces `Propiedad`, `SeccionGaleria` y `MultimediaPropiedad` de `src/features/propiedades/types/index.ts`.
- **Branding:** Los activos del agente se obtienen de `/api/perfil`.

## 5. Próximos Pasos Inmediatos
1. Crear el componente `FichaPdfGenerator.tsx`.
2. Implementar la plantilla HTML base con Tailwind CSS para el renderizado del PDF.
3. Integrar el botón de exportación en la cabecera de `PropiedadDetalle.tsx`.
