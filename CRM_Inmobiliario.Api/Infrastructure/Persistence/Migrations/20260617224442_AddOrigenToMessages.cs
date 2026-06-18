using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOrigenToMessages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AgenteId",
                table: "WhatsappMessages",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OrigenMensaje",
                table: "WhatsappMessages",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OrigenMensaje",
                table: "FacebookMessages",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AgenteId",
                table: "WhatsappMessages");

            migrationBuilder.DropColumn(
                name: "OrigenMensaje",
                table: "WhatsappMessages");

            migrationBuilder.DropColumn(
                name: "OrigenMensaje",
                table: "FacebookMessages");
        }
    }
}
