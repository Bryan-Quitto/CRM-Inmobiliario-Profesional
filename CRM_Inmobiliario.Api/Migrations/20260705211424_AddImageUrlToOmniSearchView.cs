using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddImageUrlToOmniSearchView : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
CREATE OR REPLACE VIEW vw_omni_search AS

-- 1. Contactos (Propios)
SELECT 
    c.""Id"" AS ""EntityId"",
    'Contacto' AS ""EntityType"",
    c.""Nombre"" || ' ' || COALESCE(c.""Apellido"", '') AS ""Title"",
    c.""Telefono"" AS ""Subtitle"",
    c.""NormalizedSearchText"" AS ""SearchText"",
    c.""AgenteId"" AS ""VisibleToAgenteId"",
    CAST(NULL AS text) AS ""ImageUrl""
FROM ""Contactos"" c
WHERE NOT EXISTS (
    SELECT 1 FROM ""AgentArchivedContacts"" aac 
    WHERE aac.""ContactoId"" = c.""Id"" AND aac.""AgentId"" = c.""AgenteId""
)

UNION ALL

-- 2. Contactos (Compartidos)
SELECT 
    c.""Id"" AS ""EntityId"",
    'Contacto' AS ""EntityType"",
    c.""Nombre"" || ' ' || COALESCE(c.""Apellido"", '') AS ""Title"",
    c.""Telefono"" AS ""Subtitle"",
    c.""NormalizedSearchText"" AS ""SearchText"",
    cac.""AgenteId"" AS ""VisibleToAgenteId"",
    CAST(NULL AS text) AS ""ImageUrl""
FROM ""Contactos"" c
INNER JOIN ""ContactoAgenteCompartidos"" cac ON c.""Id"" = cac.""ContactoId""
WHERE NOT EXISTS (
    SELECT 1 FROM ""AgentArchivedContacts"" aac 
    WHERE aac.""ContactoId"" = c.""Id"" AND aac.""AgentId"" = cac.""AgenteId""
)

UNION ALL

-- 3. Propiedades (Asignado)
SELECT 
    p.""Id"" AS ""EntityId"",
    'Propiedad' AS ""EntityType"",
    p.""Titulo"" AS ""Title"",
    p.""Ciudad"" || ', ' || p.""Sector"" AS ""Subtitle"",
    p.""NormalizedSearchText"" AS ""SearchText"",
    p.""AgenteId"" AS ""VisibleToAgenteId"",
    (SELECT pm.""UrlPublica"" FROM ""PropertyMedia"" pm WHERE pm.""PropiedadId"" = p.""Id"" AND pm.""EsPrincipal"" = true LIMIT 1) AS ""ImageUrl""
FROM ""Properties"" p
WHERE p.""AgenteId"" IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM ""AgentArchivedProperties"" aap 
    WHERE aap.""PropiedadId"" = p.""Id"" AND aap.""AgentId"" = p.""AgenteId""
)

UNION ALL

-- 4. Propiedades (Creador, si es diferente del asignado)
SELECT 
    p.""Id"" AS ""EntityId"",
    'Propiedad' AS ""EntityType"",
    p.""Titulo"" AS ""Title"",
    p.""Ciudad"" || ', ' || p.""Sector"" AS ""Subtitle"",
    p.""NormalizedSearchText"" AS ""SearchText"",
    p.""CreatedByAgenteId"" AS ""VisibleToAgenteId"",
    (SELECT pm.""UrlPublica"" FROM ""PropertyMedia"" pm WHERE pm.""PropiedadId"" = p.""Id"" AND pm.""EsPrincipal"" = true LIMIT 1) AS ""ImageUrl""
FROM ""Properties"" p
WHERE p.""CreatedByAgenteId"" IS NOT NULL
AND (p.""AgenteId"" IS NULL OR p.""AgenteId"" != p.""CreatedByAgenteId"")
AND NOT EXISTS (
    SELECT 1 FROM ""AgentArchivedProperties"" aap 
    WHERE aap.""PropiedadId"" = p.""Id"" AND aap.""AgentId"" = p.""CreatedByAgenteId""
)

UNION ALL

-- 5. Tareas
SELECT 
    t.""Id"" AS ""EntityId"",
    'Tarea' AS ""EntityType"",
    t.""Titulo"" AS ""Title"",
    CAST(t.""FechaInicio"" AS text) AS ""Subtitle"",
    LOWER(unaccent(t.""Titulo"" || ' ' || COALESCE(t.""Descripcion"", ''))) AS ""SearchText"",
    t.""AgenteId"" AS ""VisibleToAgenteId"",
    (SELECT pm.""UrlPublica"" FROM ""PropertyMedia"" pm WHERE pm.""PropiedadId"" = t.""PropiedadId"" AND pm.""EsPrincipal"" = true LIMIT 1) AS ""ImageUrl""
FROM ""Tasks"" t;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Restore previous view without ImageUrl
            migrationBuilder.Sql(@"
CREATE OR REPLACE VIEW vw_omni_search AS
-- 1. Contactos (Propios)
SELECT c.""Id"" AS ""EntityId"", 'Contacto' AS ""EntityType"", c.""Nombre"" || ' ' || COALESCE(c.""Apellido"", '') AS ""Title"", c.""Telefono"" AS ""Subtitle"", c.""NormalizedSearchText"" AS ""SearchText"", c.""AgenteId"" AS ""VisibleToAgenteId"" FROM ""Contactos"" c WHERE NOT EXISTS (SELECT 1 FROM ""AgentArchivedContacts"" aac WHERE aac.""ContactoId"" = c.""Id"" AND aac.""AgentId"" = c.""AgenteId"")
UNION ALL
-- 2. Contactos (Compartidos)
SELECT c.""Id"" AS ""EntityId"", 'Contacto' AS ""EntityType"", c.""Nombre"" || ' ' || COALESCE(c.""Apellido"", '') AS ""Title"", c.""Telefono"" AS ""Subtitle"", c.""NormalizedSearchText"" AS ""SearchText"", cac.""AgenteId"" AS ""VisibleToAgenteId"" FROM ""Contactos"" c INNER JOIN ""ContactoAgenteCompartidos"" cac ON c.""Id"" = cac.""ContactoId"" WHERE NOT EXISTS (SELECT 1 FROM ""AgentArchivedContacts"" aac WHERE aac.""ContactoId"" = c.""Id"" AND aac.""AgentId"" = cac.""AgenteId"")
UNION ALL
-- 3. Propiedades (Asignado)
SELECT p.""Id"" AS ""EntityId"", 'Propiedad' AS ""EntityType"", p.""Titulo"" AS ""Title"", p.""Ciudad"" || ', ' || p.""Sector"" AS ""Subtitle"", p.""NormalizedSearchText"" AS ""SearchText"", p.""AgenteId"" AS ""VisibleToAgenteId"" FROM ""Properties"" p WHERE p.""AgenteId"" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ""AgentArchivedProperties"" aap WHERE aap.""PropiedadId"" = p.""Id"" AND aap.""AgentId"" = p.""AgenteId"")
UNION ALL
-- 4. Propiedades (Creador)
SELECT p.""Id"" AS ""EntityId"", 'Propiedad' AS ""EntityType"", p.""Titulo"" AS ""Title"", p.""Ciudad"" || ', ' || p.""Sector"" AS ""Subtitle"", p.""NormalizedSearchText"" AS ""SearchText"", p.""CreatedByAgenteId"" AS ""VisibleToAgenteId"" FROM ""Properties"" p WHERE p.""CreatedByAgenteId"" IS NOT NULL AND (p.""AgenteId"" IS NULL OR p.""AgenteId"" != p.""CreatedByAgenteId"") AND NOT EXISTS (SELECT 1 FROM ""AgentArchivedProperties"" aap WHERE aap.""PropiedadId"" = p.""Id"" AND aap.""AgentId"" = p.""CreatedByAgenteId"")
UNION ALL
-- 5. Tareas
SELECT t.""Id"" AS ""EntityId"", 'Tarea' AS ""EntityType"", t.""Titulo"" AS ""Title"", CAST(t.""FechaInicio"" AS text) AS ""Subtitle"", LOWER(unaccent(t.""Titulo"" || ' ' || COALESCE(t.""Descripcion"", ''))) AS ""SearchText"", t.""AgenteId"" AS ""VisibleToAgenteId"" FROM ""Tasks"" t;
            ");
        }
    }
}
