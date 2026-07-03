# Manual de Propiedades e Inventario

Este documento detalla cómo manejar tu cartera de propiedades y los diferentes estados por los que puede pasar un inmueble.

## 1. Estados Comerciales de una Propiedad

Las propiedades pueden encontrarse en uno de los siguientes estados:

- **Disponible**: Es el estado normal de una propiedad lista para ofrecer a tus clientes. Toda propiedad nueva ingresa así.
- **Reservada**: Significa que un cliente ya dio un anticipo o separó la propiedad, por lo que no debemos ofrecerla a nadie más por el momento.
- **Vendida**: La propiedad ya tiene un nuevo dueño.
- **Alquilada**: La propiedad está siendo ocupada por un inquilino durante el tiempo que dure su contrato.
- **Inactiva**: La propiedad ya no se puede ofrecer temporalmente, por ejemplo, si el dueño decidió no vender por ahora.

### Reglas de Cambio de Estado
- **No se puede reservar lo cerrado**: Si una propiedad ya se vendió o alquiló, no puedes simplemente "reservarla" de nuevo. Primero tienes que volver a ponerla como "Disponible".

## 2. Gestión de Ciclo de Vida (Negocios Caídos y Renovaciones)

Existen dos flujos principales para que una propiedad cerrada o reservada vuelva al mercado:

### A. Cancelación de Trato (Negocio Caído)
Pasa cuando un negocio no logra cerrarse, como cuando un cliente se arrepiente y cancela su reserva.
- **El Trato**: Se registra como cancelado en el historial para que lleves el control de lo que pasó.
- **El Cliente**: 
  - Si el cliente tiene otras propiedades compradas/alquiladas, mantiene su estado "Cerrado".
  - Si el cliente tiene otras propiedades reservadas, pasa a estado "En Negociación".
  - Si no tiene otros compromisos, retrocede automáticamente al estado "Contactado".
- **La Propiedad**: Regresa al estado "Disponible".

### B. Fin de Ciclo (Renovación)
Sucede cuando, por ejemplo, un inquilino se muda porque terminó su contrato y el dueño quiere volver a alquilar la casa.
- **El Trato**: El trato de alquiler que acaba de terminar se guarda como un negocio concluido con éxito.
- **El Propietario**: Si el propietario estaba "Inactivo", la propiedad vuelve a ofrecerse pero en estado "Inactiva". Si estaba activo, la propiedad queda "Disponible".

## 3. Seguridad y Privacidad

El acceso y gestión de propiedades sigue un modelo estricto de visibilidad:
- **Visibilidad Privada**: Solo podrás ver y editar tus propias propiedades y las de tu equipo directo, manteniendo la privacidad de la información.
- **Trabajo en Equipo**: Si registraste una propiedad a nombre de un compañero que aún no activa su cuenta, podrás gestionarla. Pero en cuanto ese compañero ingrese al sistema, él tomará el control exclusivo de la propiedad.
- **Propiedades Archivadas**: Si archivaste una propiedad para no verla, no podrás cambiarle el estado a menos que la desarchives primero.

## 4. Registro de Propiedades (Captación)

Al registrar una nueva propiedad en el sistema:
- **Asignación de Dueño**: Cuando le asignas un dueño a una nueva propiedad, el sistema automáticamente lo marca como propietario.
- **Código Único**: El sistema le dará un número de referencia corto a cada casa (ej. `PRO-A1B2C`) para que puedas buscarla y encontrarla rápidamente.
- **Captador**: Puedes indicar si la propiedad la conseguiste tú, si fue otro compañero, o registrar a alguien nuevo para reconocer quién trajo el negocio.
- **Inteligencia Artificial**: En cuanto guardas la propiedad, el asistente de Inteligencia Artificial la lee y la aprende en segundos para que luego puedas encontrarla fácilmente con solo describirla.

## 5. Galería de Fotos

- **Secciones de Fotos**: Para que se vea más organizado, puedes separar las fotos por zonas, como las del patio, las habitaciones o las áreas comunes.
- **Foto Principal**: Tú decides el orden de las secciones y eliges cuál será la foto principal que se verá como portada de la propiedad en todas partes.