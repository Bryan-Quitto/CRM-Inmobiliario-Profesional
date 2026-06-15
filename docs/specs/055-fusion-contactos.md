# 055 - Fusión de Contactos

## 1. Objetivo
Permitir a los agentes del CRM consolidar el historial y los datos de dos contactos (un contacto Principal y uno Secundario) en un solo registro unificado, previniendo la colisión de canales de comunicación (WhatsApp/Facebook) y garantizando la integridad referencial en la base de datos sin pérdida de contexto.

## 2. Reglas de Negocio
- **Anti-Colisión de Canales:** El sistema prohíbe la fusión de dos contactos si ambos tienen un canal de WhatsApp activo o si ambos tienen un canal de Facebook Messenger activo. 
  - *Excepción:* Si ambos contactos poseen exactamente el mismo número de teléfono o ID de Facebook (clones literales), la fusión se permite.
- **Sobrevivencia:** El usuario selecciona el contacto "Principal". Este contacto preserva su ID, nombre principal y credenciales, mientras que el "Secundario" es eliminado tras migrar sus datos.
- **Herencia Total:** Todas las tareas pendientes, historiales de chat, propiedades captadas, transacciones e interacciones del secundario se transfieren al principal.
- **Auditoría UX:** Las discrepancias textuales (como un origen distinto, correo alternativo o notas secundarias) no se sobreescriben ni se truncan, sino que se inyectan como un nuevo evento (`Interacción` de tipo "Nota") en la Línea de Tiempo del contacto principal bajo el título de "Reporte de Fusión".

## 3. Arquitectura Técnica

### 3.1. Frontend (Feature-Sliced Design)
- **Modal Inteligente (`MergeContactosModal.tsx`):** Un modal que permite seleccionar dinámicamente al contacto secundario o invertir los roles (Swap).
- **Filtro Predictivo:** El buscador excluye localmente del autocompletado aquellos contactos que desencadenarían una colisión de canales, acompañado de un tooltip informativo (UI Optimista).
- **Zero-Wait Invalidation:** Al recibir un 200 OK, invalida la caché global de SWR para `/contactos` y recarga la UI en milisegundos.

### 3.2. Backend (Vertical Slice Architecture)
- **Comando (`FusionarContactos.cs`):** Implementado bajo el patrón CQRS para un endpoint `POST /contactos/fusionar`.
- **The One Trip Pattern:** En lugar de saturar el pool de conexiones con 15 actualizaciones Entity Framework separadas, todo el reparenting de claves foráneas 1:N y las consolidaciones matemáticas de contadores (Nro Interacciones, Cierres, etc.) ocurren mediante un bloque masivo de `ExecuteSqlRawAsync`.
- **Restricciones Únicas:** Las tablas 1:1 o con llaves compuestas (`FacebookConversations`, `ContactDailyTokenUsages`, `ContactoInteresPropiedades`) utilizan `WHERE NOT EXISTS` en Raw SQL para evitar excepciones `DbUpdateException`.
- **Transaccionalidad Resiliente:** La lógica de fusión se ejecuta dentro de un `CreateExecutionStrategy().ExecuteAsync()` para garantizar que cualquier fluctuación de red con Npgsql reinicie el bloque completo de la transacción manual de forma atómica.
- **Caché en Segundo Plano:** La purga de etiquetas en la caché local/distribuida usa `Task.WhenAll` sin hacer await HTTP bloqueante (Fire and Forget) inyectando explícitamente `CancellationToken.None`.
