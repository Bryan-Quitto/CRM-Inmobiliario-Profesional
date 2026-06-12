using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class OptimizeContactos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:pg_trgm", ",,")
                .Annotation("Npgsql:PostgresExtension:unaccent", ",,")
                .Annotation("Npgsql:PostgresExtension:vector", ",,")
                .OldAnnotation("Npgsql:PostgresExtension:unaccent", ",,")
                .OldAnnotation("Npgsql:PostgresExtension:vector", ",,");

            migrationBuilder.AddColumn<int>(
                name: "NumeroCierres",
                table: "Contactos",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "NumeroInteracciones",
                table: "Contactos",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "NumeroIntereses",
                table: "Contactos",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "NumeroPropiedadesCaptadas",
                table: "Contactos",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "NumeroReservas",
                table: "Contactos",
                type: "integer",
                nullable: false,
                defaultValue: 0);





            migrationBuilder.Sql(@"
                UPDATE ""Contactos"" c
                SET 
                    ""NumeroInteracciones"" = (SELECT count(*) FROM ""Interactions"" i WHERE i.""ContactoId"" = c.""Id""),
                    ""NumeroIntereses"" = (SELECT count(*) FROM ""ContactoInteresPropiedades"" cip WHERE cip.""ContactoId"" = c.""Id""),
                    ""NumeroPropiedadesCaptadas"" = (SELECT count(*) FROM ""Properties"" p WHERE p.""PropietarioId"" = c.""Id""),
                    ""NumeroReservas"" = (SELECT count(*) FROM ""Properties"" p WHERE p.""CerradoConId"" = c.""Id"" AND p.""EstadoComercial"" = 'Reservada'),
                    ""NumeroCierres"" = (SELECT count(*) FROM ""Properties"" p WHERE p.""CerradoConId"" = c.""Id"" AND p.""EstadoComercial"" IN ('Vendida', 'Alquilada'));
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {


            migrationBuilder.DropColumn(
                name: "NumeroCierres",
                table: "Contactos");

            migrationBuilder.DropColumn(
                name: "NumeroInteracciones",
                table: "Contactos");

            migrationBuilder.DropColumn(
                name: "NumeroIntereses",
                table: "Contactos");

            migrationBuilder.DropColumn(
                name: "NumeroPropiedadesCaptadas",
                table: "Contactos");

            migrationBuilder.DropColumn(
                name: "NumeroReservas",
                table: "Contactos");

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:unaccent", ",,")
                .Annotation("Npgsql:PostgresExtension:vector", ",,")
                .OldAnnotation("Npgsql:PostgresExtension:pg_trgm", ",,")
                .OldAnnotation("Npgsql:PostgresExtension:unaccent", ",,")
                .OldAnnotation("Npgsql:PostgresExtension:vector", ",,");



            migrationBuilder.Sql(@"DROP INDEX IF EXISTS idx_contactos_nombre_busqueda;");
        }
    }
}
