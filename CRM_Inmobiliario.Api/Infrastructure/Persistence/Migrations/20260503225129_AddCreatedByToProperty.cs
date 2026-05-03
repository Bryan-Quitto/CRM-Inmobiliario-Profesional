using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCreatedByToProperty : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByAgenteId",
                table: "Properties",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Properties_CreatedByAgenteId",
                table: "Properties",
                column: "CreatedByAgenteId");

            migrationBuilder.AddForeignKey(
                name: "FK_Properties_Agents_CreatedByAgenteId",
                table: "Properties",
                column: "CreatedByAgenteId",
                principalTable: "Agents",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Properties_Agents_CreatedByAgenteId",
                table: "Properties");

            migrationBuilder.DropIndex(
                name: "IX_Properties_CreatedByAgenteId",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "CreatedByAgenteId",
                table: "Properties");
        }
    }
}
