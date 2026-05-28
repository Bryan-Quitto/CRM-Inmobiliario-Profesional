using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class IsolateWhatsappConversationsByAgent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM \"WhatsappMessages\";");
            migrationBuilder.Sql("DELETE FROM \"WhatsappConversations\";");

            migrationBuilder.DropPrimaryKey(
                name: "PK_WhatsappConversations",
                table: "WhatsappConversations");

            migrationBuilder.AddColumn<Guid>(
                name: "ContactoId",
                table: "WhatsappMessages",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "Id",
                table: "WhatsappConversations",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "ContactoId",
                table: "WhatsappConversations",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddPrimaryKey(
                name: "PK_WhatsappConversations",
                table: "WhatsappConversations",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_WhatsappMessages_ContactoId",
                table: "WhatsappMessages",
                column: "ContactoId");

            migrationBuilder.CreateIndex(
                name: "IX_WhatsappConversations_ContactoId",
                table: "WhatsappConversations",
                column: "ContactoId");

            migrationBuilder.AddForeignKey(
                name: "FK_WhatsappConversations_Contactos_ContactoId",
                table: "WhatsappConversations",
                column: "ContactoId",
                principalTable: "Contactos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WhatsappMessages_Contactos_ContactoId",
                table: "WhatsappMessages",
                column: "ContactoId",
                principalTable: "Contactos",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WhatsappConversations_Contactos_ContactoId",
                table: "WhatsappConversations");

            migrationBuilder.DropForeignKey(
                name: "FK_WhatsappMessages_Contactos_ContactoId",
                table: "WhatsappMessages");

            migrationBuilder.DropIndex(
                name: "IX_WhatsappMessages_ContactoId",
                table: "WhatsappMessages");

            migrationBuilder.DropPrimaryKey(
                name: "PK_WhatsappConversations",
                table: "WhatsappConversations");

            migrationBuilder.DropIndex(
                name: "IX_WhatsappConversations_ContactoId",
                table: "WhatsappConversations");

            migrationBuilder.DropColumn(
                name: "ContactoId",
                table: "WhatsappMessages");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "WhatsappConversations");

            migrationBuilder.DropColumn(
                name: "ContactoId",
                table: "WhatsappConversations");

            migrationBuilder.AddPrimaryKey(
                name: "PK_WhatsappConversations",
                table: "WhatsappConversations",
                column: "Telefono");
        }
    }
}
