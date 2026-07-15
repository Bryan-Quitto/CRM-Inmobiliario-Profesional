using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MoveExtensionsToDedicatedSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                CREATE SCHEMA IF NOT EXISTS extensions;
                
                -- Move extensions to the new schema
                ALTER EXTENSION unaccent SET SCHEMA extensions;
                ALTER EXTENSION vector SET SCHEMA extensions;
                ALTER EXTENSION pg_trgm SET SCHEMA extensions;
                
                -- Ensure roles have access to the schema
                GRANT USAGE ON SCHEMA extensions TO postgres, authenticated, anon, service_role;
                
                -- Update search_path for the database and relevant roles
                ALTER DATABASE postgres SET search_path TO public, extensions;
                ALTER ROLE postgres SET search_path TO public, extensions;
                ALTER ROLE authenticator SET search_path TO public, extensions;
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER EXTENSION unaccent SET SCHEMA public;
                ALTER EXTENSION vector SET SCHEMA public;
                ALTER EXTENSION pg_trgm SET SCHEMA public;
                
                -- Revert search_path
                ALTER DATABASE postgres SET search_path TO public;
                ALTER ROLE postgres SET search_path TO public;
                ALTER ROLE authenticator SET search_path TO public;
            ");
        }
    }
}
