using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFechaProgramadaLimpiezaR2ToProperty : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "FechaProgramadaLimpiezaR2",
                table: "Properties",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FechaProgramadaLimpiezaR2",
                table: "Properties");
        }
    }
}
