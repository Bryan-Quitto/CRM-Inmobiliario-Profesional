using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddNormalizedSearchText : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NormalizedSearchText",
                table: "Contactos",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql(@"UPDATE ""Contactos"" SET ""NormalizedSearchText"" = lower(unaccent(COALESCE(""Nombre"", '') || ' ' || COALESCE(""Apellido"", '') || ' ' || COALESCE(""Email"", '') || ' ' || COALESCE(""Telefono"", '')));");

            migrationBuilder.CreateIndex(
                name: "idx_contactos_search",
                table: "Contactos",
                column: "NormalizedSearchText")
                .Annotation("Npgsql:IndexMethod", "gin")
                .Annotation("Npgsql:IndexOperators", new[] { "gin_trgm_ops" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_contactos_search",
                table: "Contactos");

            migrationBuilder.DropColumn(
                name: "NormalizedSearchText",
                table: "Contactos");
        }
    }
}
