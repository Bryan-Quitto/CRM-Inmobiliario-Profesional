using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FixDuplicateContactConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE \"Contactos\" DROP CONSTRAINT IF EXISTS \"UQ_Leads_Telefono\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Contactos_Telefono\";");

            migrationBuilder.CreateIndex(
                name: "IX_Contactos_Telefono_AgenteId",
                table: "Contactos",
                columns: new[] { "Telefono", "AgenteId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Contactos_Telefono_AgenteId",
                table: "Contactos");
        }
    }
}
