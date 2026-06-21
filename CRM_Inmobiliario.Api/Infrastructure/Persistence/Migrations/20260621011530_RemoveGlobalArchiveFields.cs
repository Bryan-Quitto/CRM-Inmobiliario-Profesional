using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveGlobalArchiveFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_properties_archivado",
                table: "Properties");

            migrationBuilder.DropIndex(
                name: "idx_contactos_archivado",
                table: "Contactos");

            migrationBuilder.DropColumn(
                name: "FechaUltimaActividad",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "IsArchived",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "FechaUltimaActividad",
                table: "Contactos");

            migrationBuilder.DropColumn(
                name: "IsArchived",
                table: "Contactos");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "FechaUltimaActividad",
                table: "Properties",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                table: "Properties",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "FechaUltimaActividad",
                table: "Contactos",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                table: "Contactos",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "idx_properties_archivado",
                table: "Properties",
                columns: new[] { "IsArchived", "FechaUltimaActividad" });

            migrationBuilder.CreateIndex(
                name: "idx_contactos_archivado",
                table: "Contactos",
                columns: new[] { "IsArchived", "FechaUltimaActividad" });
        }
    }
}
