# Reporte de Anti-patrones de Navegación (onClick en lugar de <a> / <Link>)

Se han analizado los directorios solicitados en busca de elementos (como `<button>` o `<div>`) que manejan la navegación mediante el evento `onClick` (impidiendo así que el usuario pueda usar "Abrir en nueva pestaña" o "Ctrl+Clic"). 

A continuación se detallan las ocurrencias encontradas siguiendo el formato solicitado:

- Ruta del archivo: C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\components\layout\Sidebar.tsx
- Número de línea y código encontrado: Line 80, `onClick={() => navigate(item.path)}`
- Botón en términos de usuario: Opción de navegación del menú principal en la barra lateral

- Ruta del archivo: C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\components\layout\Sidebar.tsx
- Número de línea y código encontrado: Line 102, `onClick={() => navigate('/configuracion/perfil')}`
- Botón en términos de usuario: Botón de "Configuración" en la barra lateral

- Ruta del archivo: C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\features\copilot\components\ContactCardPreview.tsx
- Número de línea y código encontrado: Line 15, `onClick={() => navigate(`/contactos/${id}`)}`
- Botón en términos de usuario: Tarjeta de previsualización de contacto mostrada en el chat (Copilot)

- Ruta del archivo: C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\features\copilot\components\PropertyCardPreview.tsx
- Número de línea y código encontrado: Line 16, `onClick={() => navigate(`/propiedades?id=${id}`)}`
- Botón en términos de usuario: Tarjeta de previsualización de propiedad mostrada en el chat (Copilot)

- Ruta del archivo: C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\features\omnisearch\components\CommandPaletteDesktop.tsx
- Número de línea y código encontrado: Line 107, `onClick={() => handleSelectStatic(option)}`
- Botón en términos de usuario: Opción estática de navegación en la paleta de comandos (versión escritorio)

- Ruta del archivo: C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\features\omnisearch\components\CommandPaletteDesktop.tsx
- Número de línea y código encontrado: Line 144, `onClick={() => handleSelectDynamic(item)}`
- Botón en términos de usuario: Resultado dinámico de búsqueda en la paleta de comandos (versión escritorio)

- Ruta del archivo: C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\features\omnisearch\components\CommandPaletteMobile.tsx
- Número de línea y código encontrado: Line 99, `onClick={() => handleSelectStatic(option)}`
- Botón en términos de usuario: Opción estática de navegación en la paleta de comandos (versión móvil)

- Ruta del archivo: C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\features\omnisearch\components\CommandPaletteMobile.tsx
- Número de línea y código encontrado: Line 136, `onClick={() => handleSelectDynamic(item)}`
- Botón en términos de usuario: Resultado dinámico de búsqueda en la paleta de comandos (versión móvil)

Nota: En los directorios `analitica` e `ia` no se encontraron ocurrencias de este patrón.
