using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAgenciaIdToProperty : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AgenciaId",
                table: "Properties",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Properties_AgenciaId",
                table: "Properties",
                column: "AgenciaId");

            migrationBuilder.AddForeignKey(
                name: "FK_Properties_Agencies_AgenciaId",
                table: "Properties",
                column: "AgenciaId",
                principalTable: "Agencies",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Properties_Agencies_AgenciaId",
                table: "Properties");

            migrationBuilder.DropIndex(
                name: "IX_Properties_AgenciaId",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "AgenciaId",
                table: "Properties");
        }
    }
}
