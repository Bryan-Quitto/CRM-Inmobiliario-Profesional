using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPropertyCodigoCorto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CodigoCorto",
                table: "Properties",
                type: "character varying(15)",
                maxLength: 15,
                nullable: false,
                defaultValue: "");

            // Generar códigos aleatorios tipo PRO-XXXXX para filas existentes
            migrationBuilder.Sql("UPDATE \"Properties\" SET \"CodigoCorto\" = 'PRO-' || substring(md5(random()::text) from 1 for 6);");

            migrationBuilder.CreateIndex(
                name: "IX_Properties_CodigoCorto",
                table: "Properties",
                column: "CodigoCorto",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Properties_CodigoCorto",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "CodigoCorto",
                table: "Properties");
        }
    }
}
