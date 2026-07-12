# Validaciones para Entidades de Propiedades

Este documento detalla las reglas de validación propuestas tanto para el backend (FluentValidation) como para el frontend (Zod), aplicadas específicamente a los campos editables o gestionables por el usuario.

## Entidad: `Property`

### Campo: `Titulo`
- **Entidad:** Property
- **Tipo:** string
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.Titulo).NotEmpty().MaximumLength(150);`
- **Reglas Frontend (Zod):** `z.string().min(1, 'El título es requerido').max(150, 'Máximo 150 caracteres')`
- **Notas de negocio:** Título descriptivo principal utilizado en los listados comerciales.

### Campo: `Descripcion`
- **Entidad:** Property
- **Tipo:** string
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.Descripcion).NotEmpty().MinimumLength(20).MaximumLength(1000);`
- **Reglas Frontend (Zod):** `z.string().min(20, 'Debe proporcionar una descripción detallada (mín. 20 caracteres)').max(1000, 'Máximo 1000 caracteres')`
- **Notas de negocio:** Puede soportar texto rico. Debe describir detalladamente los atributos del inmueble.

### Campo: `TipoPropiedad`
- **Entidad:** Property
- **Tipo:** string
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.TipoPropiedad).NotEmpty().MaximumLength(50).Must(BeValidPropertyType);`
- **Reglas Frontend (Zod):** `z.string().min(1, 'Seleccione un tipo')` (o `z.enum(['Casa', 'Departamento', 'Terreno', ...])`)
- **Notas de negocio:** Idealmente validado contra un catálogo interno predefinido.

### Campo: `Operacion`
- **Entidad:** Property
- **Tipo:** string
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.Operacion).NotEmpty().MaximumLength(50).Must(BeValidOperationType);`
- **Reglas Frontend (Zod):** `z.enum(['Venta', 'Alquiler', 'Anticresis'], { required_error: 'Seleccione el tipo de operación' })`
- **Notas de negocio:** Define el flujo del inmueble.

### Campo: `Precio`
- **Entidad:** Property
- **Tipo:** decimal
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.Precio).GreaterThan(0).ScalePrecision(2, 18);`
- **Reglas Frontend (Zod):** `z.number().positive('El precio debe ser mayor a cero').multipleOf(0.01, 'Máximo 2 decimales')`
- **Notas de negocio:** Precio comercial o precio base.

### Campo: `PrecioReserva`
- **Entidad:** Property
- **Tipo:** decimal
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.PrecioReserva).GreaterThan(0).ScalePrecision(2, 18);`
- **Reglas Frontend (Zod):** `z.number().positive('El precio de reserva debe ser mayor a cero').multipleOf(0.01, 'Máximo 2 decimales')`
- **Notas de negocio:** Valor esperado para reservar la propiedad.

### Campo: `PrecioCierre`
- **Entidad:** Property
- **Tipo:** decimal
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.PrecioCierre).GreaterThan(0).ScalePrecision(2, 18);`
- **Reglas Frontend (Zod):** `z.number().positive('El precio de cierre debe ser mayor a cero').multipleOf(0.01, 'Máximo 2 decimales')`
- **Notas de negocio:** Valor final en caso de que la propiedad pase a estado cerrado/vendido.

### Campo: `Direccion`
- **Entidad:** Property
- **Tipo:** string
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.Direccion).NotEmpty().MaximumLength(255);`
- **Reglas Frontend (Zod):** `z.string().min(1, 'Requerido').max(255)`
- **Notas de negocio:** Dirección exacta de la propiedad.

### Campo: `Sector`
- **Entidad:** Property
- **Tipo:** string
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.Sector).NotEmpty().MaximumLength(100);`
- **Reglas Frontend (Zod):** `z.string().min(1, 'Requerido').max(100)`
- **Notas de negocio:** Zona, barrio o urbanización.

### Campo: `Ciudad`
- **Entidad:** Property
- **Tipo:** string
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.Ciudad).NotEmpty().MaximumLength(100);`
- **Reglas Frontend (Zod):** `z.string().min(1, 'Requerido').max(100)`
- **Notas de negocio:** Localidad, a menudo parte de un catálogo en el frontend.

### Campo: `GoogleMapsUrl`
- **Entidad:** Property
- **Tipo:** string?
- **Obligatorio:** No
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.GoogleMapsUrl).Must(Uri.IsWellFormedUriString).When(x => !string.IsNullOrEmpty(x.GoogleMapsUrl));`
- **Reglas Frontend (Zod):** `z.string().url('Debe ser una URL válida').optional().or(z.literal(''))`
- **Notas de negocio:** Enlace para mostrar la ubicación precisa de la propiedad.

### Campo: `UrlRemax`
- **Entidad:** Property
- **Tipo:** string?
- **Obligatorio:** No
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.UrlRemax).MaximumLength(1000).Must(Uri.IsWellFormedUriString).When(x => !string.IsNullOrEmpty(x.UrlRemax));`
- **Reglas Frontend (Zod):** `z.string().url('Debe ser una URL válida').max(1000).optional().or(z.literal(''))`
- **Notas de negocio:** URL de integración externa (si aplica).

### Campo: `Habitaciones`
- **Entidad:** Property
- **Tipo:** int
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.Habitaciones).GreaterThanOrEqualTo(0);`
- **Reglas Frontend (Zod):** `z.number().int().min(0)`
- **Notas de negocio:** Cantidad de recámaras. Terrenos pueden tener 0.

### Campo: `Banos`
- **Entidad:** Property
- **Tipo:** decimal
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.Banos).GreaterThanOrEqualTo(0).ScalePrecision(1, 4);`
- **Reglas Frontend (Zod):** `z.number().min(0).multipleOf(0.1, 'Máximo 1 decimal')`
- **Notas de negocio:** Como es decimal, soporta fracciones en algunos mercados (ej. 1.5).

### Campo: `AreaTotal`
- **Entidad:** Property
- **Tipo:** decimal
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.AreaTotal).GreaterThanOrEqualTo(0).ScalePrecision(2, 18);`
- **Reglas Frontend (Zod):** `z.number().min(0).multipleOf(0.01, 'Máximo 2 decimales')`
- **Notas de negocio:** Dimensión global en m2.

### Campo: `AreaTerreno`
- **Entidad:** Property
- **Tipo:** decimal?
- **Obligatorio:** Condicional
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.AreaTerreno).GreaterThanOrEqualTo(0).ScalePrecision(2, 18).When(x => x.AreaTerreno.HasValue);`
- **Reglas Frontend (Zod):** `z.number().min(0).multipleOf(0.01, 'Máximo 2 decimales').optional().nullable()`
- **Notas de negocio:** Relevante principalemente en Casas y Terrenos.

### Campo: `AreaConstruccion`
- **Entidad:** Property
- **Tipo:** decimal?
- **Obligatorio:** Condicional
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.AreaConstruccion).GreaterThanOrEqualTo(0).ScalePrecision(2, 18).When(x => x.AreaConstruccion.HasValue);`
- **Reglas Frontend (Zod):** `z.number().min(0).multipleOf(0.01, 'Máximo 2 decimales').optional().nullable()`
- **Notas de negocio:** Irrelevante en la mayoría de los Terrenos vacíos.

### Campo: `Estacionamientos`
- **Entidad:** Property
- **Tipo:** int?
- **Obligatorio:** No
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.Estacionamientos).GreaterThanOrEqualTo(0).When(x => x.Estacionamientos.HasValue);`
- **Reglas Frontend (Zod):** `z.number().int().min(0).optional().nullable()`
- **Notas de negocio:** Plazas de garaje asociadas.

### Campo: `MediosBanos`
- **Entidad:** Property
- **Tipo:** int?
- **Obligatorio:** No
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.MediosBanos).GreaterThanOrEqualTo(0).When(x => x.MediosBanos.HasValue);`
- **Reglas Frontend (Zod):** `z.number().int().min(0).optional().nullable()`
- **Notas de negocio:** Baños de visita o sin regadera.

### Campo: `AniosAntiguedad`
- **Entidad:** Property
- **Tipo:** int?
- **Obligatorio:** No
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.AniosAntiguedad).GreaterThanOrEqualTo(0).When(x => x.AniosAntiguedad.HasValue);`
- **Reglas Frontend (Zod):** `z.number().int().min(0).optional().nullable()`
- **Notas de negocio:** Valor de 0 puede interpretarse como A estrenar o En construcción.

### Campo: `EstadoComercial`
- **Entidad:** Property
- **Tipo:** string
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.EstadoComercial).NotEmpty().MaximumLength(50);`
- **Reglas Frontend (Zod):** `z.enum(['Disponible', 'Reservada', 'Vendida', 'Alquilada', 'Inactiva'])`
- **Notas de negocio:** Refleja la visibilidad y disponibilidad actual de la propiedad.

### Campo: `EsCaptacionPropia`
- **Entidad:** Property
- **Tipo:** bool
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.EsCaptacionPropia).NotNull();`
- **Reglas Frontend (Zod):** `z.boolean()`
- **Notas de negocio:** Determina si la agencia captó directamente la propiedad.

### Campo: `PorcentajeComision`
- **Entidad:** Property
- **Tipo:** decimal
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.PorcentajeComision).InclusiveBetween(0, 100).ScalePrecision(2, 5);`
- **Reglas Frontend (Zod):** `z.number().min(0).max(100).multipleOf(0.01, 'Máximo 2 decimales')`
- **Notas de negocio:** Representa el porcentaje negociado.


## Entidad: `PropertyMedia`

### Campo: `Descripcion`
- **Entidad:** PropertyMedia
- **Tipo:** string?
- **Obligatorio:** No
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.Descripcion).MaximumLength(100).When(x => !string.IsNullOrEmpty(x.Descripcion));`
- **Reglas Frontend (Zod):** `z.string().max(100).optional().nullable()`
- **Notas de negocio:** Alt text o epígrafe complementario de la foto.

### Campo: `EsPrincipal` 
- **Entidad:** PropertyMedia
- **Tipo:** bool
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.EsPrincipal).NotNull();`
- **Reglas Frontend (Zod):** `z.boolean()`
- **Notas de negocio:** Usada en el backend/frontend para portadas (Hero/Thumbnail). Ideal validar que exista solo una.

### Campo: `Orden`
- **Entidad:** PropertyMedia
- **Tipo:** int
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.Orden).GreaterThanOrEqualTo(0);`
- **Reglas Frontend (Zod):** `z.number().int().min(0)`
- **Notas de negocio:** Orden natural visual de los elementos para el slider o cuadrícula.


## Entidad: `PropertyGallerySection`

### Campo: `Nombre`
- **Entidad:** PropertyGallerySection
- **Tipo:** string
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.Nombre).NotEmpty().MaximumLength(100);`
- **Reglas Frontend (Zod):** `z.string().min(1, 'Requerido').max(100)`
- **Notas de negocio:** Título de la sección como "Master Suite" o "Zonas Comunes".

### Campo: `Descripcion`
- **Entidad:** PropertyGallerySection
- **Tipo:** string
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.Descripcion).NotEmpty().MaximumLength(500);`
- **Reglas Frontend (Zod):** `z.string().min(1, 'Requerido').max(500)`
- **Notas de negocio:** Explicación que puede renderizarse al inicio de cada sub-galería.

### Campo: `Orden`
- **Entidad:** PropertyGallerySection
- **Tipo:** int
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.Orden).GreaterThanOrEqualTo(0);`
- **Reglas Frontend (Zod):** `z.number().int().min(0)`
- **Notas de negocio:** Posición de la sección en la galería vertical/horizontal.


## Entidad: `PropertyFaq`

### Campo: `Pregunta`
- **Entidad:** PropertyFaq
- **Tipo:** string
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.Pregunta).NotEmpty().MaximumLength(255);`
- **Reglas Frontend (Zod):** `z.string().min(5, 'La pregunta debe ser clara').max(255)`
- **Notas de negocio:** Duda frecuente del posible comprador/inquilino.

### Campo: `Respuesta`
- **Entidad:** PropertyFaq
- **Tipo:** string
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.Respuesta).NotEmpty().MinimumLength(10).MaximumLength(500);`
- **Reglas Frontend (Zod):** `z.string().min(10, 'La respuesta es obligatoria y debe ser descriptiva').max(500, 'Máximo 500 caracteres')`
- **Notas de negocio:** Respuesta oficial respaldada por la agencia.

### Campo: `Estado`
- **Entidad:** PropertyFaq
- **Tipo:** string
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.Estado).NotEmpty().MaximumLength(20);`
- **Reglas Frontend (Zod):** `z.enum(['Borrador', 'EnRevision', 'Aprobada', 'Rechazada', 'Desactivada'])`
- **Notas de negocio:** Determina si la FAQ es pública en el listado web de la propiedad.

### Campo: `NotaRechazo`
- **Entidad:** PropertyFaq
- **Tipo:** string?
- **Obligatorio:** Condicional (obligatorio al rechazar)
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.NotaRechazo).NotEmpty().MaximumLength(500).When(x => x.Estado == "Rechazada");`
- **Reglas Frontend (Zod):** `z.string().min(1, 'Debe indicar por qué se rechaza').max(500, 'Máximo 500 caracteres').optional()`
- **Notas de negocio:** Razón dada por un administrador/manager cuando devuelve a corrección.


## Entidad: `PropertyTransaction`

### Campo: `Amount`
- **Entidad:** PropertyTransaction
- **Tipo:** decimal
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.Amount).GreaterThan(0).ScalePrecision(2, 18);`
- **Reglas Frontend (Zod):** `z.number().positive('El monto debe ser mayor a cero').multipleOf(0.01, 'Máximo 2 decimales')`
- **Notas de negocio:** Monto monetario del hito.

### Campo: `Notes`
- **Entidad:** PropertyTransaction
- **Tipo:** string?
- **Obligatorio:** No
- **Reglas Backend (FluentValidation):** `RuleFor(x => x.Notes).MaximumLength(500).When(x => !string.IsNullOrEmpty(x.Notes));`
- **Reglas Frontend (Zod):** `z.string().max(500).optional().nullable()`
- **Notas de negocio:** Observaciones en texto libre.


## Campos Excluidos

Los siguientes campos NO deben exponerse en formularios de edición ni deben ser inputs directos de usuarios. Son gestionados automáticamente por el sistema o por el motor de la base de datos:

- **`Id`** (Todas las entidades): Identificadores únicos (`Guid`) manejados por la base de datos o internamente al instanciar.
- **`CodigoCorto`** (`Property`): Se asigna automáticamente como un NanoId para identificar rápidamente la propiedad.
- **`EsCaptadorActivo`** (`Property`): Indicador booleano calculado/asignado en backend basado en permisos de la propiedad.
- **`Relaciones (AgenteId, AgenciaId, AgenteCerradorId, PropietarioId, CerradoConId)`** (`Property`): Identificadores foráneos manejados mediante auto-asignación o componentes internos, pero sin input directo general.
- **`FechaProgramadaLimpiezaR2`** (`Property`): Fecha proyectada para procesos en backend de depuración del storage R2.
- **`SectionId`, `TipoMultimedia`, `UrlPublica`** (`PropertyMedia`): Metadatos asignados por el backend post-upload u organizados internamente sin inputs directos.
- **`ContactoId`, `TransactionType`, `TransactionStatus`, `TransactionDate`** (`PropertyTransaction`): Valores intrínsecos al hito comercial asignados automáticamente por el sistema.
- **`FechaArchivado`, `FechaCierre`** (`Property`): Estampas de tiempo que son pobladas automáticamente acorde a la transición del estado comercial en el backend. *(Nota: `FechaIngreso` corresponde a la Fecha de Captación y sí es un campo editable en el frontend)*.
- **`Version`** (`Property`): Token numérico inyectado con `[Timestamp]`, para optimización de bloqueos y manejo de concurrencia de EF Core.
- **`NormalizedSearchText`** (`Property`): String autocomputado que indexa atributos para el Full Text Search (FTS).
- **`VectorEmbedding`, `GeminiEmbedding`** (`Property`): Vectores matemáticos `vector(1536)` generados en background mediante integración con IA, inmutables por el usuario.
- **`CreatedByAgenteId`, `CreadoPorAgenteId`, `CreatedById`** (`Property`, `PropertyFaq`, `PropertyTransaction`): Campos de auditoría seteados de forma obligatoria en la creación mediante el _Context_ de autenticación o el JWT del usuario logueado.
- **`PropiedadId`** (`PropertyMedia`, `PropertyGallerySection`, `PropertyFaq`, `PropertyTransaction`): Referencia FK del parent. Como estas entidades se editan subordinadas a la vista de la propiedad activa, la ruta o controlador inyecta la referencia, por lo que nunca se capturan en un _input_ abierto del frontend.
- **`StoragePath`** (`PropertyMedia`): Ubicación lógica interna dentro de un bucket S3 o Cloudflare R2, mantenida únicamente por el Storage Service de la API.
- **`FechaCreacion`, `FechaActualizacion`** (`PropertyGallerySection`, `PropertyFaq`): Logs automatizados a nivel de Repositorio o EF Interceptor en cada inserción/mutación.
