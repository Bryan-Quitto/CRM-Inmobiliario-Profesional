# Reporte de elementos interactivos sin cursor-pointer

- Ruta del archivo: C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\components\layout\Footer.tsx
- Número de línea y elemento encontrado: Line 7, <a href="/terminos" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
- Breve motivo: Al ser un enlace de navegación, debe indicar interactividad mediante el cursor pointer.
- Boton encontrado en terminos de usuario: Enlace de "Términos" en el pie de página.

- Ruta del archivo: C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\components\layout\Footer.tsx
- Número de línea y elemento encontrado: Line 9, <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
- Breve motivo: Al ser un enlace de navegación, debe indicar interactividad mediante el cursor pointer.
- Boton encontrado en terminos de usuario: Enlace de "Privacidad" en el pie de página.

- Ruta del archivo: C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\components\layout\Sidebar.tsx
- Número de línea y elemento encontrado: Line 54, <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] md:hidden transition-opacity duration-300" onClick={() => setIsOpen(false)} aria-hidden="true" />
- Breve motivo: Elemento interactivo usado como overlay para cerrar el menú. Requiere el cursor pointer explícito por estándar.
- Boton encontrado en terminos de usuario: Fondo oscuro para cerrar el menú lateral en dispositivos móviles.

- Ruta del archivo: C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\components\ui\MobileInfoPopover.tsx
- Número de línea y elemento encontrado: Line 37, <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
- Breve motivo: Overlay interactivo que cierra el popover al hacer clic. Requiere el cursor pointer explícito por estándar.
- Boton encontrado en terminos de usuario: Fondo oscuro para cerrar la información detallada en móviles.

- Ruta del archivo: C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\components\ui\MobileInfoPopover.tsx
- Número de línea y elemento encontrado: Line 44, <div className="bg-white rounded-xl shadow-2xl w-full max-w-[320px] p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
- Breve motivo: Contenedor con manejo de eventos de clic (onClick) que recae bajo la regla de elementos interactivos del proyecto.
- Boton encontrado en terminos de usuario: Tarjeta flotante de información en móviles.

- Ruta del archivo: C:\Users\THINKPAD\Desktop\CRM Inmobiliario Profesional\CRM_Inmobiliario_Web\src\components\ui\MobileInfoPopover.tsx
- Número de línea y elemento encontrado: Line 51, <button onClick={() => setIsOpen(false)} className="w-full py-2.5 px-4 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-medium transition-colors">
- Breve motivo: Botón de acción explícita que debe indicar interactividad al usuario con la clase cursor-pointer.
- Boton encontrado en terminos de usuario: Botón de "Cerrar" en la alerta o ventana de información móvil.

Nota: El directorio `src/layouts` especificado no existe en el proyecto. Se escanearon todos los componentes dentro de `src/components`, incluyendo `src/components/layout`.
