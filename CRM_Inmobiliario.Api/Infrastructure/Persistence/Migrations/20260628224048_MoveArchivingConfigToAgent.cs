using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MoveArchivingConfigToAgent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AutoArchivarContactos",
                table: "Agencies");

            migrationBuilder.DropColumn(
                name: "AutoArchivarPropiedades",
                table: "Agencies");

            migrationBuilder.DropColumn(
                name: "DiasInactividadContactos",
                table: "Agencies");

            migrationBuilder.DropColumn(
                name: "DiasInactividadPropiedades",
                table: "Agencies");

            migrationBuilder.AddColumn<bool>(
                name: "AutoArchivarContactos",
                table: "Agents",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AutoArchivarPropiedades",
                table: "Agents",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "DiasInactividadContactos",
                table: "Agents",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "DiasInactividadPropiedades",
                table: "Agents",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AutoArchivarContactos",
                table: "Agents");

            migrationBuilder.DropColumn(
                name: "AutoArchivarPropiedades",
                table: "Agents");

            migrationBuilder.DropColumn(
                name: "DiasInactividadContactos",
                table: "Agents");

            migrationBuilder.DropColumn(
                name: "DiasInactividadPropiedades",
                table: "Agents");

            migrationBuilder.AddColumn<bool>(
                name: "AutoArchivarContactos",
                table: "Agencies",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AutoArchivarPropiedades",
                table: "Agencies",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "DiasInactividadContactos",
                table: "Agencies",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "DiasInactividadPropiedades",
                table: "Agencies",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
