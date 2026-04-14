using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MigracioninicialconEF : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Agents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Apellido = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Telefono = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Agencia = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    FotoUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    LogoUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Rol = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false),
                    FechaCreacion = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Agents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Leads",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Apellido = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Telefono = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Origen = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    EtapaEmbudo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AgenteId = table.Column<Guid>(type: "uuid", nullable: false),
                    Notas = table.Column<string>(type: "text", nullable: true),
                    FechaCreacion = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    FechaCierre = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Leads", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Leads_Agents_AgenteId",
                        column: x => x.AgenteId,
                        principalTable: "Agents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Properties",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Titulo = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Descripcion = table.Column<string>(type: "text", nullable: false),
                    TipoPropiedad = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Operacion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Precio = table.Column<decimal>(type: "numeric(12,2)", nullable: false),
                    PrecioCierre = table.Column<decimal>(type: "numeric(12,2)", nullable: true),
                    Direccion = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Sector = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Ciudad = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    GoogleMapsUrl = table.Column<string>(type: "text", nullable: true),
                    Habitaciones = table.Column<int>(type: "integer", nullable: false),
                    Banos = table.Column<decimal>(type: "numeric(3,1)", nullable: false),
                    AreaTotal = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    EstadoComercial = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    EsCaptacionPropia = table.Column<bool>(type: "boolean", nullable: false),
                    PorcentajeComision = table.Column<decimal>(type: "numeric", nullable: false),
                    AgenteId = table.Column<Guid>(type: "uuid", nullable: false),
                    PropietarioId = table.Column<Guid>(type: "uuid", nullable: true),
                    CerradoConId = table.Column<Guid>(type: "uuid", nullable: true),
                    FechaIngreso = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    FechaCierre = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Properties", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Properties_Agents_AgenteId",
                        column: x => x.AgenteId,
                        principalTable: "Agents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Properties_Leads_CerradoConId",
                        column: x => x.CerradoConId,
                        principalTable: "Leads",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Properties_Leads_PropietarioId",
                        column: x => x.PropietarioId,
                        principalTable: "Leads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Interactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AgenteId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClienteId = table.Column<Guid>(type: "uuid", nullable: false),
                    PropiedadId = table.Column<Guid>(type: "uuid", nullable: true),
                    TipoInteraccion = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Notas = table.Column<string>(type: "text", nullable: false),
                    FechaInteraccion = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Interactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Interactions_Agents_AgenteId",
                        column: x => x.AgenteId,
                        principalTable: "Agents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Interactions_Leads_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Leads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Interactions_Properties_PropiedadId",
                        column: x => x.PropiedadId,
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "LeadPropertyInterests",
                columns: table => new
                {
                    ClienteId = table.Column<Guid>(type: "uuid", nullable: false),
                    PropiedadId = table.Column<Guid>(type: "uuid", nullable: false),
                    NivelInteres = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FechaRegistro = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeadPropertyInterests", x => new { x.ClienteId, x.PropiedadId });
                    table.ForeignKey(
                        name: "FK_LeadPropertyInterests_Leads_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Leads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LeadPropertyInterests_Properties_PropiedadId",
                        column: x => x.PropiedadId,
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PropertyGallerySections",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PropiedadId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
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

            migrationBuilder.CreateTable(
                name: "Tasks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AgenteId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClienteId = table.Column<Guid>(type: "uuid", nullable: true),
                    PropiedadId = table.Column<Guid>(type: "uuid", nullable: true),
                    Titulo = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Descripcion = table.Column<string>(type: "text", nullable: true),
                    TipoTarea = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FechaInicio = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    DuracionMinutos = table.Column<int>(type: "integer", nullable: false),
                    ColorHex = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true),
                    Lugar = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Estado = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tasks_Agents_AgenteId",
                        column: x => x.AgenteId,
                        principalTable: "Agents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Tasks_Leads_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Leads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Tasks_Properties_PropiedadId",
                        column: x => x.PropiedadId,
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "PropertyMedia",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PropiedadId = table.Column<Guid>(type: "uuid", nullable: false),
                    SectionId = table.Column<Guid>(type: "uuid", nullable: true),
                    TipoMultimedia = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    UrlPublica = table.Column<string>(type: "text", nullable: false),
                    Descripcion = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    StoragePath = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    EsPrincipal = table.Column<bool>(type: "boolean", nullable: false),
                    Orden = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PropertyMedia", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PropertyMedia_Properties_PropiedadId",
                        column: x => x.PropiedadId,
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PropertyMedia_PropertyGallerySections_SectionId",
                        column: x => x.SectionId,
                        principalTable: "PropertyGallerySections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Agents_Email",
                table: "Agents",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Interactions_AgenteId",
                table: "Interactions",
                column: "AgenteId");

            migrationBuilder.CreateIndex(
                name: "IX_Interactions_ClienteId",
                table: "Interactions",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Interactions_PropiedadId",
                table: "Interactions",
                column: "PropiedadId");

            migrationBuilder.CreateIndex(
                name: "IX_LeadPropertyInterests_PropiedadId",
                table: "LeadPropertyInterests",
                column: "PropiedadId");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_Performance_AgenteEtapaFecha",
                table: "Leads",
                columns: new[] { "AgenteId", "EtapaEmbudo", "FechaCierre", "FechaCreacion" });

            migrationBuilder.CreateIndex(
                name: "IX_Properties_CerradoConId",
                table: "Properties",
                column: "CerradoConId");

            migrationBuilder.CreateIndex(
                name: "IX_Properties_Performance_AgenteEstadoCaptacion",
                table: "Properties",
                columns: new[] { "AgenteId", "EstadoComercial", "EsCaptacionPropia", "FechaIngreso" });

            migrationBuilder.CreateIndex(
                name: "IX_Properties_PropietarioId",
                table: "Properties",
                column: "PropietarioId");

            migrationBuilder.CreateIndex(
                name: "IX_PropertyGallerySections_PropiedadId",
                table: "PropertyGallerySections",
                column: "PropiedadId");

            migrationBuilder.CreateIndex(
                name: "IX_PropertyMedia_PropiedadId",
                table: "PropertyMedia",
                column: "PropiedadId");

            migrationBuilder.CreateIndex(
                name: "IX_PropertyMedia_SectionId",
                table: "PropertyMedia",
                column: "SectionId");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_ClienteId",
                table: "Tasks",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_Performance_AgenteEstadoTipoFecha",
                table: "Tasks",
                columns: new[] { "AgenteId", "Estado", "TipoTarea", "FechaInicio" });

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_PropiedadId",
                table: "Tasks",
                column: "PropiedadId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Interactions");

            migrationBuilder.DropTable(
                name: "LeadPropertyInterests");

            migrationBuilder.DropTable(
                name: "PropertyMedia");

            migrationBuilder.DropTable(
                name: "Tasks");

            migrationBuilder.DropTable(
                name: "PropertyGallerySections");

            migrationBuilder.DropTable(
                name: "Properties");

            migrationBuilder.DropTable(
                name: "Leads");

            migrationBuilder.DropTable(
                name: "Agents");
        }
    }
}
