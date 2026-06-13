using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCorporateFieldsToAgency : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContextoCorporativoIA",
                table: "Agencies",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DireccionFisica",
                table: "Agencies",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmailCorporativo",
                table: "Agencies",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SitioWeb",
                table: "Agencies",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TelefonoCorporativo",
                table: "Agencies",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContextoCorporativoIA",
                table: "Agencies");

            migrationBuilder.DropColumn(
                name: "DireccionFisica",
                table: "Agencies");

            migrationBuilder.DropColumn(
                name: "EmailCorporativo",
                table: "Agencies");

            migrationBuilder.DropColumn(
                name: "SitioWeb",
                table: "Agencies");

            migrationBuilder.DropColumn(
                name: "TelefonoCorporativo",
                table: "Agencies");
        }
    }
}
