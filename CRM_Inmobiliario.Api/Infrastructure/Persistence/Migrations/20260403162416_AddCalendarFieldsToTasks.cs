using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCalendarFieldsToTasks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "FechaVencimiento",
                table: "Tasks",
                newName: "FechaInicio");

            migrationBuilder.AddColumn<string>(
                name: "ColorHex",
                table: "Tasks",
                type: "character varying(7)",
                maxLength: 7,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DuracionMinutos",
                table: "Tasks",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ColorHex",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "DuracionMinutos",
                table: "Tasks");

            migrationBuilder.RenameColumn(
                name: "FechaInicio",
                table: "Tasks",
                newName: "FechaVencimiento");
        }
    }
}
