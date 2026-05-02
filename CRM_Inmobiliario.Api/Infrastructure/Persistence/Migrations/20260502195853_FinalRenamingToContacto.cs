using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FinalRenamingToContacto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Renombrar Tablas Principales
            migrationBuilder.RenameTable(
                name: "Leads",
                newName: "Contactos");

            migrationBuilder.RenameTable(
                name: "LeadPropertyInterests",
                newName: "ContactoInteresPropiedades");

            // 2. Renombrar Columnas en Tablas Relacionadas
            migrationBuilder.RenameColumn(
                name: "ClienteId",
                table: "Tasks",
                newName: "ContactoId");

            migrationBuilder.RenameIndex(
                name: "IX_Tasks_ClienteId",
                table: "Tasks",
                newName: "IX_Tasks_ContactoId");

            migrationBuilder.RenameColumn(
                name: "LeadId",
                table: "PropertyTransactions",
                newName: "ContactoId");

            migrationBuilder.RenameIndex(
                name: "IX_PropertyTransactions_LeadId",
                table: "PropertyTransactions",
                newName: "IX_PropertyTransactions_ContactoId");

            migrationBuilder.RenameColumn(
                name: "ClienteId",
                table: "Interactions",
                newName: "ContactoId");

            migrationBuilder.RenameIndex(
                name: "IX_Interactions_ClienteId",
                table: "Interactions",
                newName: "IX_Interactions_ContactoId");

            migrationBuilder.RenameColumn(
                name: "ClienteId",
                table: "ContactoInteresPropiedades",
                newName: "ContactoId");

            migrationBuilder.RenameColumn(
                name: "TelefonoCliente",
                table: "AiActionLogs",
                newName: "TelefonoContacto");

            migrationBuilder.RenameColumn(
                name: "ClienteId",
                table: "AiActionLogs",
                newName: "ContactoId");
            
            // 3. Actualizar Índices
            migrationBuilder.RenameIndex(
                name: "IX_Leads_Performance_AgenteEtapaFecha",
                table: "Contactos",
                newName: "IX_Contactos_Performance_AgenteEtapaFecha");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameTable(
                name: "Contactos",
                newName: "Leads");

            migrationBuilder.RenameTable(
                name: "ContactoInteresPropiedades",
                newName: "LeadPropertyInterests");

            migrationBuilder.RenameColumn(
                name: "ContactoId",
                table: "Tasks",
                newName: "ClienteId");

            migrationBuilder.RenameIndex(
                name: "IX_Tasks_ContactoId",
                table: "Tasks",
                newName: "IX_Tasks_ClienteId");

            migrationBuilder.RenameColumn(
                name: "ContactoId",
                table: "PropertyTransactions",
                newName: "LeadId");

            migrationBuilder.RenameIndex(
                name: "IX_PropertyTransactions_ContactoId",
                table: "PropertyTransactions",
                newName: "IX_PropertyTransactions_LeadId");

            migrationBuilder.RenameColumn(
                name: "ContactoId",
                table: "Interactions",
                newName: "ClienteId");

            migrationBuilder.RenameIndex(
                name: "IX_Interactions_ContactoId",
                table: "Interactions",
                newName: "IX_Interactions_ClienteId");

            migrationBuilder.RenameColumn(
                name: "ContactoId",
                table: "ContactoInteresPropiedades",
                newName: "ClienteId");

            migrationBuilder.RenameColumn(
                name: "TelefonoContacto",
                table: "AiActionLogs",
                newName: "TelefonoCliente");

            migrationBuilder.RenameColumn(
                name: "ContactoId",
                table: "AiActionLogs",
                newName: "ClienteId");

            migrationBuilder.RenameIndex(
                name: "IX_Contactos_Performance_AgenteEtapaFecha",
                table: "Leads",
                newName: "IX_Leads_Performance_AgenteEtapaFecha");
        }
    }
}
