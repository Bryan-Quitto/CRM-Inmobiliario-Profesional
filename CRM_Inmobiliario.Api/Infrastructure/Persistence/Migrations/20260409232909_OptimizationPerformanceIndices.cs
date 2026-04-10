using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class OptimizationPerformanceIndices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PropertyMedia_PropertyGallerySections_SectionId",
                table: "PropertyMedia");

            migrationBuilder.DropIndex(
                name: "IX_Tasks_AgenteId",
                table: "Tasks");

            migrationBuilder.DropIndex(
                name: "IX_Properties_AgenteId",
                table: "Properties");

            migrationBuilder.DropIndex(
                name: "IX_Leads_AgenteId",
                table: "Leads");

            migrationBuilder.AddColumn<string>(
                name: "Lugar",
                table: "Tasks",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Descripcion",
                table: "PropertyGallerySections",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CerradoConId",
                table: "Properties",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GoogleMapsUrl",
                table: "Properties",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_Performance_AgenteEstadoTipoFecha",
                table: "Tasks",
                columns: new[] { "AgenteId", "Estado", "TipoTarea", "FechaInicio" });

            migrationBuilder.CreateIndex(
                name: "IX_Properties_CerradoConId",
                table: "Properties",
                column: "CerradoConId");

            migrationBuilder.CreateIndex(
                name: "IX_Properties_Performance_AgenteEstadoCaptacion",
                table: "Properties",
                columns: new[] { "AgenteId", "EstadoComercial", "EsCaptacionPropia", "FechaIngreso" });

            migrationBuilder.CreateIndex(
                name: "IX_Leads_Performance_AgenteEtapaFecha",
                table: "Leads",
                columns: new[] { "AgenteId", "EtapaEmbudo", "FechaCierre", "FechaCreacion" });

            migrationBuilder.AddForeignKey(
                name: "FK_Properties_Leads_CerradoConId",
                table: "Properties",
                column: "CerradoConId",
                principalTable: "Leads",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PropertyMedia_PropertyGallerySections_SectionId",
                table: "PropertyMedia",
                column: "SectionId",
                principalTable: "PropertyGallerySections",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Properties_Leads_CerradoConId",
                table: "Properties");

            migrationBuilder.DropForeignKey(
                name: "FK_PropertyMedia_PropertyGallerySections_SectionId",
                table: "PropertyMedia");

            migrationBuilder.DropIndex(
                name: "IX_Tasks_Performance_AgenteEstadoTipoFecha",
                table: "Tasks");

            migrationBuilder.DropIndex(
                name: "IX_Properties_CerradoConId",
                table: "Properties");

            migrationBuilder.DropIndex(
                name: "IX_Properties_Performance_AgenteEstadoCaptacion",
                table: "Properties");

            migrationBuilder.DropIndex(
                name: "IX_Leads_Performance_AgenteEtapaFecha",
                table: "Leads");

            migrationBuilder.DropColumn(
                name: "Lugar",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "Descripcion",
                table: "PropertyGallerySections");

            migrationBuilder.DropColumn(
                name: "CerradoConId",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "GoogleMapsUrl",
                table: "Properties");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_AgenteId",
                table: "Tasks",
                column: "AgenteId");

            migrationBuilder.CreateIndex(
                name: "IX_Properties_AgenteId",
                table: "Properties",
                column: "AgenteId");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_AgenteId",
                table: "Leads",
                column: "AgenteId");

            migrationBuilder.AddForeignKey(
                name: "FK_PropertyMedia_PropertyGallerySections_SectionId",
                table: "PropertyMedia",
                column: "SectionId",
                principalTable: "PropertyGallerySections",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
