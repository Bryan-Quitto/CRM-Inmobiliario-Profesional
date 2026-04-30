# Spec 015: Dualidad Prospecto-Propietario

## Purpose
Establecer la lógica de negocio y UI para manejar a los "Propietarios" dentro del CRM. Se reutilizará la entidad `Lead` para permitir que un mismo contacto pueda actuar como Prospecto (comprador) y como Propietario (vendedor) simultáneamente, evitando la duplicación de registros y centralizando el historial de interacciones.

## Requirements

### Requirement: Especialización del Lead (Backend)
El sistema DEBE permitir que un `Lead` sea identificado como Propietario de Inmuebles sin perder su estatus potencial como Prospecto.
- Se AÑADIRÁ una nueva propiedad booleana `EsPropietario` a la entidad `Lead`.
- El valor por defecto para `EsPropietario` DEBERÍA ser `false` a menos que se cree explícitamente desde un contexto de Propietario.

#### Scenario: Registro explícito de Propietario
- DADO que un usuario crea un nuevo contacto desde el módulo de "Propietarios"
- CUANDO se guardan los datos
- ENTONCES el nuevo registro de `Lead` DEBE tener `EsPropietario` establecido en `true`.

### Requirement: Navegación Segregada de Contactos (Frontend)
El sistema DEBE proporcionar vistas de lista distintas para Prospectos y Propietarios, manteniéndolos bajo un paraguas conceptual unificado.
- El Sidebar AGRUPARÁ estas vistas (ej. bajo "Contactos") o las listará de forma adyacente.
- La lista de "Prospectos" DEBE filtrar los leads para mostrar aquellos que son compradores/arrendatarios activos (ej. `EtapaEmbudo` no es nula/vacía).
- La lista de "Propietarios" DEBE filtrar los leads para mostrar solo aquellos donde `EsPropietario == true`.

#### Scenario: Acceso a la lista de Propietarios
- DADO un agente autenticado
- CUANDO navega a la sección de "Propietarios"
- ENTONCES la tabla de datos DEBE mostrar únicamente los leads marcados con `EsPropietario`.

### Requirement: Ficha Técnica Polimórfica (Detalle de Cliente)
El sistema DEBE presentar una vista de detalle unificada (`ClienteDetalle.tsx`) que renderice módulos dinámicamente según los roles activos del contacto.
- El encabezado DEBE indicar claramente si el contacto es "Prospecto", "Propietario" o ambos.
- Si `EsPropietario` es true, la vista DEBE renderizar un módulo de "Propiedades Captadas".
- Si el contacto tiene una etapa de embudo activa, la vista DEBE renderizar el módulo de "Intereses".

#### Scenario: Visualización de un contacto con rol dual
- DADO un contacto que está buscando una nueva casa y vendiendo la suya actual
- CUANDO el usuario abre su vista de detalle
- ENTONCES el sistema DEBE mostrar tanto sus intereses guardados como las propiedades de su autoría, sin duplicar info de contacto ni historial.

### Requirement: Asignación Dinámica en Propiedades
El sistema DEBE permitir asignar un propietario a una propiedad durante la creación o edición mediante una búsqueda dinámica.
- El `PropiedadForm` INCLUIRÁ un `DynamicSearchSelect` apuntando al endpoint de búsqueda de clientes.
- Si el contacto seleccionado no tiene el flag `EsPropietario` activo, el sistema DEBE actualizar automáticamente su estatus a `EsPropietario = true` al guardar la propiedad.

#### Scenario: Upgrade automático de Prospecto a Propietario
- DADO un usuario creando un nuevo listado de propiedad
- CUANDO selecciona un Prospecto existente desde el selector de dueños y guarda la propiedad
- ENTONCES la propiedad DEBE quedar vinculada a ese contacto Y el flag `EsPropietario` del contacto DEBE actualizarse a `true`.
