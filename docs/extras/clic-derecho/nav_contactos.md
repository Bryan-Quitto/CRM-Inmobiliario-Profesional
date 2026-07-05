# Reporte de anti-patrones de navegación en `contactos`

Se han encontrado los siguientes elementos que utilizan `onClick` para navegar (mediante `navigate` o `window.open`) en lugar de usar etiquetas estándar `<a>` o `<Link>`:

- Ruta del archivo: `src/features/contactos/components/ContactosKanbanDesktop.tsx`
- Número de línea y código encontrado: Line 115, `<div onClick={() => !snapshot.isDragging && onNavigate(contacto.id)}>`
- Botón en términos de usuario: Tarjeta de contacto en la vista Kanban (Escritorio)

- Ruta del archivo: `src/features/contactos/components/ContactosKanbanMobile.tsx`
- Número de línea y código encontrado: Line 76, `<div onClick={() => !snapshot.isDragging && onNavigate(contacto.id)}>`
- Botón en términos de usuario: Tarjeta de contacto en la vista Kanban (Móvil)

- Ruta del archivo: `src/features/contactos/components/contacto-detalle-sections/ContactoHeader.tsx`
- Número de línea y código encontrado: Line 48, `<button onClick={() => navigate(backPath)}>`
- Botón en términos de usuario: Botón de regresar ('←') en el encabezado del detalle del contacto

- Ruta del archivo: `src/features/contactos/components/contactos-list-sections/ContactoCard.tsx`
- Número de línea y código encontrado: Line 127, `<button onClick={() => onNavigate(contacto.id)}>`
- Botón en términos de usuario: Botón "Ver Detalles" (flecha superior derecha) en la tarjeta de contacto de la lista

- Ruta del archivo: `src/features/contactos/components/ContactoDetalleDesktop.tsx`
- Número de línea y código encontrado: Line 96, `<button onClick={() => isNetworkError ? window.location.reload() : navigate('/contactos')}>`
- Botón en términos de usuario: Botón "Volver a Cartera" o "Reintentar" en la pantalla de error del detalle del contacto (Escritorio)

- Ruta del archivo: `src/features/contactos/components/ContactoDetalleMobile.tsx`
- Número de línea y código encontrado: Line 99, `<button onClick={() => isNetworkError ? window.location.reload() : navigate('/contactos')}>`
- Botón en términos de usuario: Botón "Volver a Cartera" o "Reintentar" en la pantalla de error del detalle del contacto (Móvil)

- Ruta del archivo: `src/features/contactos/components/contacto-detalle-sections/ContactoInterestsManager.tsx`
- Número de línea y código encontrado: Line 208, `<button onClick={() => window.open(\`/propiedades?id=${interes.propiedadId}\`, '_blank')}>`
- Botón en términos de usuario: Botón "Abrir en nueva pestaña" (ícono ExternalLink) en la tarjeta de interés de propiedad vinculada

- Ruta del archivo: `src/features/contactos/components/contacto-detalle-sections/ContactoPropertiesOwned.tsx`
- Número de línea y código encontrado: Line 88, `<button onClick={() => window.open(\`/propiedades?id=${prop.id}\`, '_blank')}>`
- Botón en términos de usuario: Botón "Abrir en nueva pestaña" (ícono ExternalLink) en la tarjeta de propiedad del propietario

- Ruta del archivo: `src/features/contactos/components/contacto-detalle-sections/ContactoTransactions.tsx`
- Número de línea y código encontrado: Line 74, `<button onClick={() => window.open(\`/propiedades?id=${transaccion.propiedadId}\`, '_blank')}>`
- Botón en términos de usuario: Botón "Abrir en nueva pestaña" (ícono ExternalLink) en la tarjeta de transacción
