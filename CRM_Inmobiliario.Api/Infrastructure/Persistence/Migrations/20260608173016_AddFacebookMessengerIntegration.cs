using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFacebookMessengerIntegration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FacebookSenderId",
                table: "Contactos",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FacebookPageAccessToken",
                table: "Agents",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FacebookPageId",
                table: "Agents",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FacebookPageName",
                table: "Agents",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsFacebookAiEnabled",
                table: "Agents",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "FacebookConversations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ContactoId = table.Column<Guid>(type: "uuid", nullable: true),
                    FacebookSenderId = table.Column<string>(type: "text", nullable: false),
                    PageId = table.Column<string>(type: "text", nullable: false),
                    AgenteId = table.Column<Guid>(type: "uuid", nullable: false),
                    HistorialJson = table.Column<string>(type: "text", nullable: false),
                    UltimaActualizacion = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FacebookConversations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FacebookMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ContactoId = table.Column<Guid>(type: "uuid", nullable: true),
                    FacebookSenderId = table.Column<string>(type: "text", nullable: false),
                    AgenteId = table.Column<Guid>(type: "uuid", nullable: false),
                    Rol = table.Column<string>(type: "text", nullable: false),
                    Contenido = table.Column<string>(type: "text", nullable: false),
                    Fecha = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FacebookMessages", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FacebookConversations");

            migrationBuilder.DropTable(
                name: "FacebookMessages");

            migrationBuilder.DropColumn(
                name: "FacebookSenderId",
                table: "Contactos");

            migrationBuilder.DropColumn(
                name: "FacebookPageAccessToken",
                table: "Agents");

            migrationBuilder.DropColumn(
                name: "FacebookPageId",
                table: "Agents");

            migrationBuilder.DropColumn(
                name: "FacebookPageName",
                table: "Agents");

            migrationBuilder.DropColumn(
                name: "IsFacebookAiEnabled",
                table: "Agents");
        }
    }
}
