# Plan de Implementación: Importación de Propiedades desde REMAX

Este plan documenta la arquitectura técnica para cumplir con la importación automática de propiedades desde URLs de **remax.com.ec** hacia el formulario de `CrearPropiedadForm.tsx`. 

## User Review Required

> [!WARNING]
> **Web Scraping:** Esta funcionalidad utilizará *scraping* en el backend mediante `HtmlAgilityPack`. Remax no provee una API pública oficial para desarrolladores externos. Esto significa que si Remax Ecuador cambia drásticamente el diseño de su página web (nombres de clases CSS o tags HTML), el scraper deberá recibir mantenimiento y ser actualizado.

> [!IMPORTANT]
> **Campo de Imágenes:** Actualmente `CrearPropiedadForm.tsx` solo maneja texto (título, área, ubicación, precio, etc.) y la carga de imágenes ocurre en otro módulo. Por lo tanto, el scraper inicialmente extraerá **únicamente** los datos de texto (precio, habitaciones, área, título, descripción) para autocompletar este formulario, y no descargará imágenes automáticamente hacia el Storage.

## Proposed Changes

---

### Backend (.NET 10 - API)

#### [NEW] `CRM_Inmobiliario.Api.csproj` (Dependencia)
Se instalará el paquete `HtmlAgilityPack` que permitirá descargar y parsear el HTML de Remax de forma robusta.
* Comando propuesto: `dotnet add package HtmlAgilityPack`

#### [NEW] `Features/Propiedades/ImportarDeUrlRemax.cs`
Cumpliendo con la arquitectura Vertical Slice, este único archivo contendrá:
1. **Endpoint `POST /api/propiedades/importar-remax`** (Protegido por JWT).
2. **Command / Request DTO:** Recibirá `public record ImportarRemaxRequest(string Url)`.
3. **Handler:** 
   - Utilizará `HttpClient` nativo para descargar la web.
   - Analizará nodos HTML (Meta Tags OGP, clases específicas como `.price`, `.description`, etc.) usando `HtmlAgilityPack`.
   - Limpiará caracteres monetarios (ej. de "$ 120,000.00" a un número natural `120000`).
4. **Response DTO:** Retornará un objeto JSON mapeado similar a `CrearPropiedadDTO` con los valores que haya logrado rescatar (si no encuentra un valor, viajará como `null` o vacío).

---

### Frontend (React 19 - Vite)

#### [NEW] `src/features/propiedades/api/importarPropiedadRemax.ts`
Un archivo de lógica `fetch` simple para comunicarse con el nuevo endpoint `/api/propiedades/importar-remax` mandando el JWT Auth Token y devolviendo el objeto extraído.

#### [MODIFY] `src/features/propiedades/components/CrearPropiedadForm.tsx`
- **UI Nueva:** Añadiremos en la cabecera un campo extra `URL de Remax (opcional)` con un botón **"🪄 Autocompletar"**.
- **UX/Velocidad:** Al pulsar el botón, el cursor del botón cambiará a *Loading...* (respetando la regla *Zero-Wait* y feedback al usuario).
- **Lógica:** Al resolver la promesa, usaremos destructuring y los métodos `setValue('campo', valor)` o `reset(mergedValues)` de **React Hook Form**. 
- Esto inyecta dinámicamente: Título, Operación (se tratará de inferir Venta/Alquiler desde la URL), Precio, Habitaciones, Baños, Área Total y Descripción, sin borrar los campos que el usuario no importó.


## Open Questions

> [!IMPORTANT]
> 1. **Extracción Restringida:** Asumo que el formato a escanear será estrictamente el de `https://www.remax.com.ec`. Si intentan poner de `plusvalia.com` no funcionará y lanzará una excepción alertando al usuario. ¿Estás de acuerdo con restringirlo solo a Remax por el momento?
> 2. **Formato de Sector y Ciudad:** El scraper traerá texto puro para ciudad y sector. Si actualmente estos inputs son validaciones libres (`input type="text"`) todo funcionará bien. Si necesitan una regla de negocio especial, házmelo saber.
