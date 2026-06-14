using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCanalToAiActionLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AiActionLogs_TelefonoFecha",
                table: "AiActionLogs");

            migrationBuilder.AddColumn<string>(
                name: "Canal",
                table: "AiActionLogs",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_AiActionLogs_CanalTelefonoFecha",
                table: "AiActionLogs",
                columns: new[] { "Canal", "TelefonoContacto", "Fecha" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AiActionLogs_CanalTelefonoFecha",
                table: "AiActionLogs");

            migrationBuilder.DropColumn(
                name: "Canal",
                table: "AiActionLogs");

            migrationBuilder.CreateIndex(
                name: "IX_AiActionLogs_TelefonoFecha",
                table: "AiActionLogs",
                columns: new[] { "TelefonoContacto", "Fecha" });
        }
    }
}
