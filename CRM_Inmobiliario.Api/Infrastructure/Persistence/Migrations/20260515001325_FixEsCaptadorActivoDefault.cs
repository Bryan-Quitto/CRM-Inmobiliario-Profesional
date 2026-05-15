using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FixEsCaptadorActivoDefault : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Corregir datos existentes: Si tiene un agente asignado, debe ser activo por defecto
            migrationBuilder.Sql("UPDATE \"Properties\" SET \"EsCaptadorActivo\" = true WHERE \"AgenteId\" IS NOT NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
