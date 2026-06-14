using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MakeTelefonoOptionalForNonWhatsApp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Contactos_Telefono_AgenteId",
                table: "Contactos");

            migrationBuilder.CreateIndex(
                name: "IX_Contactos_Telefono_AgenteId",
                table: "Contactos",
                columns: new[] { "Telefono", "AgenteId" },
                unique: true,
                filter: "\"Telefono\" <> ''");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Contactos_Telefono_AgenteId",
                table: "Contactos");

            migrationBuilder.CreateIndex(
                name: "IX_Contactos_Telefono_AgenteId",
                table: "Contactos",
                columns: new[] { "Telefono", "AgenteId" },
                unique: true);
        }
    }
}
