using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Migrations
{
    /// <inheritdoc />
    public partial class RenameEtapaToEstado : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "EtapaEmbudo",
                table: "Contactos",
                newName: "EstadoEmbudo");

            migrationBuilder.RenameIndex(
                name: "IX_Contactos_Performance_AgenteEtapaFecha",
                table: "Contactos",
                newName: "IX_Contactos_Performance_AgenteEstadoFecha");

            migrationBuilder.RenameColumn(
                name: "EtapaNueva",
                table: "ContactoHistorialEmbudos",
                newName: "EstadoNuevo");

            migrationBuilder.RenameColumn(
                name: "EtapaAnterior",
                table: "ContactoHistorialEmbudos",
                newName: "EstadoAnterior");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "EstadoEmbudo",
                table: "Contactos",
                newName: "EtapaEmbudo");

            migrationBuilder.RenameIndex(
                name: "IX_Contactos_Performance_AgenteEstadoFecha",
                table: "Contactos",
                newName: "IX_Contactos_Performance_AgenteEtapaFecha");

            migrationBuilder.RenameColumn(
                name: "EstadoNuevo",
                table: "ContactoHistorialEmbudos",
                newName: "EtapaNueva");

            migrationBuilder.RenameColumn(
                name: "EstadoAnterior",
                table: "ContactoHistorialEmbudos",
                newName: "EtapaAnterior");
        }
    }
}
