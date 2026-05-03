using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCreatedByToAgent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "Agents",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Agents_CreatedById",
                table: "Agents",
                column: "CreatedById");

            migrationBuilder.AddForeignKey(
                name: "FK_Agents_Agents_CreatedById",
                table: "Agents",
                column: "CreatedById",
                principalTable: "Agents",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Agents_Agents_CreatedById",
                table: "Agents");

            migrationBuilder.DropIndex(
                name: "IX_Agents_CreatedById",
                table: "Agents");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "Agents");
        }
    }
}
