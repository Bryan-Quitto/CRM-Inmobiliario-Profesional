using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CorregirTablasIA : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AniosAntiguedad",
                table: "Properties",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "AreaConstruccion",
                table: "Properties",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "AreaTerreno",
                table: "Properties",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Estacionamientos",
                table: "Properties",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MediosBanos",
                table: "Properties",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UrlRemax",
                table: "Properties",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AiActionLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TelefonoCliente = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Accion = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DetalleJson = table.Column<string>(type: "text", nullable: true),
                    Fecha = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiActionLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "WhatsappConversations",
                columns: table => new
                {
                    Telefono = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    HistorialJson = table.Column<string>(type: "text", nullable: false),
                    UltimaActualizacion = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WhatsappConversations", x => x.Telefono);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AiActionLogs_TelefonoFecha",
                table: "AiActionLogs",
                columns: new[] { "TelefonoCliente", "Fecha" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AiActionLogs");

            migrationBuilder.DropTable(
                name: "WhatsappConversations");

            migrationBuilder.DropColumn(
                name: "AniosAntiguedad",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "AreaConstruccion",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "AreaTerreno",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "Estacionamientos",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "MediosBanos",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "UrlRemax",
                table: "Properties");
        }
    }
}
