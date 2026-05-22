using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddHistorialEmbudo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ContactoHistorialEmbudos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ContactoId = table.Column<Guid>(type: "uuid", nullable: false),
                    EtapaAnterior = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    EtapaNueva = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FechaCambio = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContactoHistorialEmbudos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContactoHistorialEmbudos_Contactos_ContactoId",
                        column: x => x.ContactoId,
                        principalTable: "Contactos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ContactoHistorialEmbudos_ContactoId",
                table: "ContactoHistorialEmbudos",
                column: "ContactoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ContactoHistorialEmbudos");
        }
    }
}
