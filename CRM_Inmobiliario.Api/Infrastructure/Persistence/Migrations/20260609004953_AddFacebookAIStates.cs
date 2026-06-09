using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFacebookAIStates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "BotActivoFB",
                table: "Contactos",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "BotActivoWA",
                table: "Contactos",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "EstadoIA_FB",
                table: "Contactos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EstadoIA_WA",
                table: "Contactos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Channel",
                table: "ContactDailyTokenUsages",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "WhatsApp");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BotActivoFB",
                table: "Contactos");

            migrationBuilder.DropColumn(
                name: "BotActivoWA",
                table: "Contactos");

            migrationBuilder.DropColumn(
                name: "EstadoIA_FB",
                table: "Contactos");

            migrationBuilder.DropColumn(
                name: "EstadoIA_WA",
                table: "Contactos");

            migrationBuilder.DropColumn(
                name: "Channel",
                table: "ContactDailyTokenUsages");
        }
    }
}
