using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RLS_ContactDailyTokenUsage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Activar RLS. Al no existir políticas (Policies) permisivas, se bloquea TODO el acceso 
            // desde clientes directos (anon, authenticated), aislando los datos de la IA.
            // El backend .NET sigue teniendo acceso total al usar la cadena de conexión de postgres (service_role).
            migrationBuilder.Sql("ALTER TABLE \"ContactDailyTokenUsages\" ENABLE ROW LEVEL SECURITY;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE \"ContactDailyTokenUsages\" DISABLE ROW LEVEL SECURITY;");
        }
    }
}
