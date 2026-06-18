using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFaqsAndEscalacion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PendingEscalamientoJobId",
                table: "Contactos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PendingEscalamientoTareaId",
                table: "Contactos",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PropertyFaqs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PropiedadId = table.Column<Guid>(type: "uuid", nullable: false),
                    Pregunta = table.Column<string>(type: "text", nullable: false),
                    Respuesta = table.Column<string>(type: "text", nullable: false),
                    Estado = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreadoPorAgenteId = table.Column<Guid>(type: "uuid", nullable: false),
                    NotaRechazo = table.Column<string>(type: "text", nullable: true),
                    FechaCreacion = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    FechaActualizacion = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PropertyFaqs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PropertyFaqs_Agents_CreadoPorAgenteId",
                        column: x => x.CreadoPorAgenteId,
                        principalTable: "Agents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PropertyFaqs_Properties_PropiedadId",
                        column: x => x.PropiedadId,
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_property_faqs_propiedad_estado",
                table: "PropertyFaqs",
                columns: new[] { "PropiedadId", "Estado" });

            migrationBuilder.CreateIndex(
                name: "IX_PropertyFaqs_CreadoPorAgenteId",
                table: "PropertyFaqs",
                column: "CreadoPorAgenteId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PropertyFaqs");

            migrationBuilder.DropColumn(
                name: "PendingEscalamientoJobId",
                table: "Contactos");

            migrationBuilder.DropColumn(
                name: "PendingEscalamientoTareaId",
                table: "Contactos");
        }
    }
}
