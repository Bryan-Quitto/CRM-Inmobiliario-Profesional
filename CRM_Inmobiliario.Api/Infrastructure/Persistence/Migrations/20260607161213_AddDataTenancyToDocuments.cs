using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDataTenancyToDocuments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AgenciaId",
                table: "Documents",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AgenciaId",
                table: "DocumentChunks",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Documents_AgenciaId",
                table: "Documents",
                column: "AgenciaId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentChunks_AgenciaId",
                table: "DocumentChunks",
                column: "AgenciaId");

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentChunks_Agencies_AgenciaId",
                table: "DocumentChunks",
                column: "AgenciaId",
                principalTable: "Agencies",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_Agencies_AgenciaId",
                table: "Documents",
                column: "AgenciaId",
                principalTable: "Agencies",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DocumentChunks_Agencies_AgenciaId",
                table: "DocumentChunks");

            migrationBuilder.DropForeignKey(
                name: "FK_Documents_Agencies_AgenciaId",
                table: "Documents");

            migrationBuilder.DropIndex(
                name: "IX_Documents_AgenciaId",
                table: "Documents");

            migrationBuilder.DropIndex(
                name: "IX_DocumentChunks_AgenciaId",
                table: "DocumentChunks");

            migrationBuilder.DropColumn(
                name: "AgenciaId",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "AgenciaId",
                table: "DocumentChunks");
        }
    }
}
