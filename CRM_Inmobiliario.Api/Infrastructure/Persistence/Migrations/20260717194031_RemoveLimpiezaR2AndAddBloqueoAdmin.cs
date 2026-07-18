using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveLimpiezaR2AndAddBloqueoAdmin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FechaProgramadaLimpiezaR2",
                table: "Properties");

            migrationBuilder.RenameColumn(
                name: "BloqueoLimpiezaOverride",
                table: "Properties",
                newName: "BloqueoAdministrativo");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "BloqueoAdministrativo",
                table: "Properties",
                newName: "BloqueoLimpiezaOverride");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "FechaProgramadaLimpiezaR2",
                table: "Properties",
                type: "timestamp with time zone",
                nullable: true);
        }
    }
}
