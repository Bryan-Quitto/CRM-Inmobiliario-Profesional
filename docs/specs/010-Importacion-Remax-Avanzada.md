# Plan de Implementación: Importación Remax (Avanzada) & Mejora de Detalles

Este documento detalla la arquitectura necesaria para resolver los problemas de formato detectados (títulos con SEO, floats numéricos corruptos, descripción truncada y precios erróneos) y para expandir la extracción a todos los campos técnicos que ofrece Remax.

## User Review Required

> [!WARNING]
> **Expansión de la Base de Datos:** Extraer *todos* los campos de Remax implica que la aplicación debe ser capaz de guardarlos. Esto requerirá agregar nuevas columnas a la tabla de `Propiedades` en Supabase: `AreaTerreno`, `AreaConstruccion` (ya tenemos `AreaTotal`), `Estacionamientos`, `MediosBanos` y `AniosAntiguedad`. 

> [!CAUTION]
> **Manejo de Decimales Ecuatorianos:** Remax mezcla notaciones. Usa `128.000 USD` (punto como separador de miles) pero usa `124.77 m²` (punto como separador decimal). Modificaremos la lógica C# para interpretar correctamente el tipo de dato utilizando conversiones especializadas basadas en el texto que las acompaña.

## Proposed Changes

---

### Backend (.NET 10 - API)

#### [MODIFY] `Features/Propiedades/ImportarDeUrlRemax.cs`
Se reescribirá casi por completo la heurística de extracción utilizando XPath robustos en `HtmlAgilityPack`:
- **Título:** Buscará el nodo `<h1>` de la propiedad pura en lugar del `og:title`.
- **Descripción:** Buscará el contenedor de texto principal en el DOM debajo del título "Descripción" (omitiendo el `meta og:description` truncado de los CMS).
- **Precio:** Extraerá el texto con `USD` y removerá los puntos de mil antes de parsearlo a entero.
- **Ubicación Exacta:** Buscará la sección "Ubicación" y extraerá todo su contenido (`Las Aceitunas y Chamburos S/N...`) para inyectarlo en `Direccion`.
- **Nuevos Campos Estructurales:** Con expresiones regulares específicas extraerá `m² terreno`, `parqueadero`, `medio baño`, `años antigüedad` y `m² cubiertos`. 

#### [MODIFY] `Domain/Entities/Property.cs` (y comandos de Registrar y Actualizar Propiedad)
Extenderemos la entidad principal y los request/responses de creación y actualización para incluir (todos opcionales):
- `public decimal? AreaTerreno { get; set; }`
- `public decimal? AreaConstruccion { get; set; }`
- `public int? Estacionamientos { get; set; }`
- `public int? MediosBanos { get; set; }`
- `public int? AniosAntiguedad { get; set; }`

---

### Frontend (React 19 - Vite)

#### [MODIFY] `src/features/propiedades/components/CrearPropiedadForm.tsx`
- Se añadirán al formulario los campos de **Estacionamientos**, **Medios Baños**, **Área Terreno**, **Área Construcción** y **Antigüedad (años)**.
- **Renderizado Dinámico:** Estos nuevos campos aparecerán / se ocultarán dependiendo del `tipoPropiedad` seleccionado (ej. en Terreno no se muestra "Habitaciones" ni "Baños"). El scraper inyectará datos en estos nuevos campos.

#### [MODIFY] `src/features/propiedades/components/PropiedadDetalle.tsx`
- **Modernización de la Cuadrícula Estadística:** La sección "Estadísticas Inteligentes" se transformará en un *grid dinámico responsivo* muy visual.
- Agregaremos los iconos necesarios (ej. `Car` de Lucide para parqueaderos).
- Se mostrarán condicionalmente: si la propiedad tiene `estacionamientos > 0`, la tarjeta asoma; si tiene `medios baños`, se renderiza una tarjeta combinada con baños enteros, etc.

## Open Questions

> [!IMPORTANT]
> 1. **Columnas Base de Datos:** ¿Estás de acuerdo con el agregado de las columnas `AreaTerreno`, `AreaConstruccion`, `Estacionamientos`, `MediosBanos` y `AniosAntiguedad` a la BD? Asumo que al igual que en la fase anterior, crearás un script CLI de Supabase para insertarlas por tu lado.
> 2. **Formulario Creación Rápida:** Si la propiedad no tiene Estacionamientos ni Medio Baño, ¿preferirías que en el formulario igual se vean estos inputs como opciones opcionales, o en su defecto que para un "Departamento" o "Casa" siempre los mostremos (ya que suelen tener) aunque Remax haya traido vacío?

## Verification Plan
1. Correr el scraper sobre un enlace maestro.
2. Comprobar que C# extraiga exactamente el título H1, Precio, Descripción Completa y Dirección Completa.
3. Actualizar `PropiedadDetalle.tsx` para asegurar que el grid visual responda dinámicamente a todos los nuevos atributos.
