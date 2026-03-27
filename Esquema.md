# Diccionario de Datos - CRM Inmobiliario (Fase 1)

**Stack Tecnológico:** .NET 10 (EF Core Code-First) + PostgreSQL (Supabase)

---

## 1. Usuarios (`Agents`)
Gestiona el acceso al sistema. El `Id` debe coincidir con el UUID devuelto por Supabase Auth.

| Columna | PostgreSQL | C# (.NET 10) | Llaves | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `Id` | `UUID` | `Guid` | PK | Identificador único vinculado a Supabase Auth. |
| `Nombre` | `VARCHAR(100)` | `string` | - | Nombre del agente. |
| `Apellido` | `VARCHAR(100)` | `string` | - | Apellido del agente. |
| `Email` | `VARCHAR(255)` | `string` | - | Correo electrónico (único). |
| `Telefono` | `VARCHAR(20)` | `string?` | - | Teléfono de contacto. |
| `Rol` | `VARCHAR(50)` | `string` | - | Rol en el sistema (Admin, Agente). |
| `Activo` | `BOOLEAN` | `bool` | - | Control de acceso lógico (Soft Delete). |
| `FechaCreacion` | `TIMESTAMPTZ` | `DateTimeOffset` | - | Fecha en que se registró el usuario. |

## 2. Clientes (`Leads`)
Gestión de prospectos. `Apellido` y `Email` permiten nulos para admitir ingresos rápidos desde campañas.

| Columna | PostgreSQL | C# (.NET 10) | Llaves | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `Id` | `UUID` | `Guid` | PK | Identificador único del cliente. |
| `Nombre` | `VARCHAR(100)` | `string` | - | Nombre de pila (Obligatorio). |
| `Apellido` | `VARCHAR(100)` | `string?` | - | Apellido (Opcional). |
| `Email` | `VARCHAR(255)` | `string?` | - | Correo electrónico (Opcional). |
| `Telefono` | `VARCHAR(20)` | `string` | - | Teléfono principal, vital para WhatsApp. |
| `Origen` | `VARCHAR(50)` | `string` | - | De dónde llegó (Facebook, Rótulo, Referido). |
| `EtapaEmbudo` | `VARCHAR(50)` | `string` | - | Estado actual (Nuevo, Contactado, Negociación). |
| `AgenteId` | `UUID` | `Guid` | FK | Relación con la tabla `Usuarios` (Quién lo atiende). |
| `Notas` | `TEXT` | `string?` | - | Contexto general o perfil del cliente. |
| `FechaCreacion` | `TIMESTAMPTZ` | `DateTimeOffset` | - | Fecha de ingreso al CRM. |

## 3. Propiedades (`Properties`)
El catálogo central de inmuebles.

| Columna | PostgreSQL | C# (.NET 10) | Llaves | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `Id` | `UUID` | `Guid` | PK | Identificador único del inmueble. |
| `Titulo` | `VARCHAR(150)` | `string` | - | Titular atractivo para la publicación. |
| `Descripcion` | `TEXT` | `string` | - | Detalles completos de la propiedad. |
| `TipoPropiedad` | `VARCHAR(50)` | `string` | - | Ej: Casa, Departamento, Terreno. |
| `Operacion` | `VARCHAR(50)` | `string` | - | Venta, Alquiler, o Venta/Alquiler. |
| `Precio` | `DECIMAL(12,2)` | `decimal` | - | Precio de lista. |
| `PrecioCierre` | `DECIMAL(12,2)` | `decimal?` | - | Precio final real (Nulo hasta el cierre). |
| `Direccion` | `VARCHAR(255)` | `string` | - | Dirección exacta. |
| `Sector` | `VARCHAR(100)` | `string` | - | Barrio o sector para filtros de búsqueda. |
| `Ciudad` | `VARCHAR(100)` | `string` | - | Ciudad donde se ubica. |
| `Habitaciones` | `INTEGER` | `int` | - | Cantidad de cuartos (0 para terrenos). |
| `Banos` | `DECIMAL(3,1)` | `decimal` | - | Permite medios baños (Ej: 2.5). |
| `AreaTotal` | `DECIMAL(10,2)` | `decimal` | - | Metros cuadrados totales. |
| `EstadoComercial` | `VARCHAR(50)` | `string` | - | Disponible, Reservada, Vendida, etc. |
| `AgenteId` | `UUID` | `Guid` | FK | Relación con `Usuarios` (Quién la captó). |
| `PropietarioId` | `UUID` | `Guid` | FK | Relación con `Clientes` (El dueño). |
| `FechaIngreso` | `TIMESTAMPTZ` | `DateTimeOffset` | - | Cuándo entró al catálogo. |
| `FechaCierre` | `TIMESTAMPTZ` | `DateTimeOffset?` | - | Fecha en que se concretó el negocio. |

## 4. Archivos Multimedia (`PropertyMedia`)
Soporte para fotos, videos y tours 360°, optimizado para Object Storage.

| Columna | PostgreSQL | C# (.NET 10) | Llaves | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `Id` | `UUID` | `Guid` | PK | Identificador único del archivo. |
| `PropiedadId` | `UUID` | `Guid` | FK | Relación con la tabla `Propiedades`. |
| `TipoMultimedia`| `VARCHAR(50)` | `string` | - | Imagen, Video_URL, Tour360. |
| `UrlPublica` | `TEXT` | `string` | - | URL accesible para mostrar en el frontend. |
| `StoragePath` | `VARCHAR(255)` | `string?` | - | Ruta interna en Supabase para facilitar borrados. |
| `EsPrincipal` | `BOOLEAN` | `bool` | - | Define si es la foto de portada. |
| `Orden` | `INTEGER` | `int` | - | Para organizar la galería (1, 2, 3...). |

## 5. Intereses de Clientes (`LeadPropertyInterests`)
Tabla puente (Many-to-Many) para rastrear qué opciones se le han presentado a un lead.

| Columna | PostgreSQL | C# (.NET 10) | Llaves | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `ClienteId` | `UUID` | `Guid` | PK, FK | Relación con `Clientes`. |
| `PropiedadId` | `UUID` | `Guid` | PK, FK | Relación con `Propiedades`. |
| `NivelInteres` | `VARCHAR(50)` | `string` | - | Alto, Medio, Bajo, Descartada. |
| `FechaRegistro` | `TIMESTAMPTZ` | `DateTimeOffset` | - | Cuándo se le presentó esta opción. |

## 6. Tareas y Eventos (`Tasks`)
Agenda del agente. Las referencias a clientes y propiedades son opcionales.

| Columna | PostgreSQL | C# (.NET 10) | Llaves | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `Id` | `UUID` | `Guid` | PK | Identificador de la tarea. |
| `AgenteId` | `UUID` | `Guid` | FK | Usuario que debe realizar la tarea. |
| `ClienteId` | `UUID` | `Guid?` | FK | (Opcional) Cliente involucrado. |
| `PropiedadId` | `UUID` | `Guid?` | FK | (Opcional) Propiedad a visitar/mostrar. |
| `Titulo` | `VARCHAR(150)` | `string` | - | Ej: "Mostrar casa en Ficoa". |
| `Descripcion` | `TEXT` | `string?` | - | Detalles o instrucciones de la tarea. |
| `TipoTarea` | `VARCHAR(50)` | `string` | - | Llamada, Visita, Reunión, Trámite. |
| `FechaVencimiento`| `TIMESTAMPTZ` | `DateTimeOffset` | - | Cuándo debe ejecutarse. |
| `Estado` | `VARCHAR(50)` | `string` | - | Pendiente, Completada, Cancelada. |

## 7. Interacciones e Historial (`Interactions`)
Bitácora de seguimiento de comunicación.

| Columna | PostgreSQL | C# (.NET 10) | Llaves | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `Id` | `UUID` | `Guid` | PK | Identificador de la interacción. |
| `AgenteId` | `UUID` | `Guid` | FK | Quién registró la interacción. |
| `ClienteId` | `UUID` | `Guid` | FK | Con qué cliente se interactuó. |
| `PropiedadId` | `UUID` | `Guid?` | FK | (Opcional) Si hablaron de una casa en específico. |
| `TipoInteraccion`| `VARCHAR(50)` | `string` | - | WhatsApp, Llamada, Email, Presencial. |
| `Notas` | `TEXT` | `string` | - | Resumen detallado de la conversación. |
| `FechaInteraccion`| `TIMESTAMPTZ` | `DateTimeOffset` | - | Momento exacto del contacto. |