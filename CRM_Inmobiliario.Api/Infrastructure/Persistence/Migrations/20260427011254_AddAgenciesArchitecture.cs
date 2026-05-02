using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAgenciesArchitecture : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Agencia",
                table: "Agents");

            migrationBuilder.AddColumn<Guid>(
                name: "AgenciaId",
                table: "Agents",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Agencies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    FechaCreacion = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Agencies", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Agents_AgenciaId",
                table: "Agents",
                column: "AgenciaId");

            migrationBuilder.AddForeignKey(
                name: "FK_Agents_Agencies_AgenciaId",
                table: "Agents",
                column: "AgenciaId",
                principalTable: "Agencies",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Agents_Agencies_AgenciaId",
                table: "Agents");

            migrationBuilder.DropTable(
                name: "Agencies");

            migrationBuilder.DropIndex(
                name: "IX_Agents_AgenciaId",
                table: "Agents");

            migrationBuilder.DropColumn(
                name: "AgenciaId",
                table: "Agents");

            migrationBuilder.AddColumn<string>(
                name: "Agencia",
                table: "Agents",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }
    }
}
