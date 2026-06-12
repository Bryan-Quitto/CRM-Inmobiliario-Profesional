using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class OptimizePropertySearch : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NormalizedSearchText",
                table: "Properties",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "idx_properties_search",
                table: "Properties",
                column: "NormalizedSearchText")
                .Annotation("Npgsql:IndexMethod", "gin")
                .Annotation("Npgsql:IndexOperators", new[] { "gin_trgm_ops" });

            migrationBuilder.Sql(@"
                UPDATE ""Properties""
                SET ""NormalizedSearchText"" = lower(unaccent(
                    COALESCE(""Titulo"", '') || ' ' || 
                    COALESCE(""Descripcion"", '') || ' ' || 
                    COALESCE(""Sector"", '') || ' ' || 
                    COALESCE(""Ciudad"", '')
                ));
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_properties_search",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "NormalizedSearchText",
                table: "Properties");
        }
    }
}
