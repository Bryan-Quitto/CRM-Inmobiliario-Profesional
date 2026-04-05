using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EvolucionGaleriaEstructurada : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Descripcion",
                table: "PropertyMedia",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SectionId",
                table: "PropertyMedia",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PropertyGallerySections",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PropiedadId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Orden = table.Column<int>(type: "integer", nullable: false),
                    FechaCreacion = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PropertyGallerySections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PropertyGallerySections_Properties_PropiedadId",
                        column: x => x.PropiedadId,
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PropertyMedia_SectionId",
                table: "PropertyMedia",
                column: "SectionId");

            migrationBuilder.CreateIndex(
                name: "IX_PropertyGallerySections_PropiedadId",
                table: "PropertyGallerySections",
                column: "PropiedadId");

            migrationBuilder.AddForeignKey(
                name: "FK_PropertyMedia_PropertyGallerySections_SectionId",
                table: "PropertyMedia",
                column: "SectionId",
                principalTable: "PropertyGallerySections",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PropertyMedia_PropertyGallerySections_SectionId",
                table: "PropertyMedia");

            migrationBuilder.DropTable(
                name: "PropertyGallerySections");

            migrationBuilder.DropIndex(
                name: "IX_PropertyMedia_SectionId",
                table: "PropertyMedia");

            migrationBuilder.DropColumn(
                name: "Descripcion",
                table: "PropertyMedia");

            migrationBuilder.DropColumn(
                name: "SectionId",
                table: "PropertyMedia");
        }
    }
}
