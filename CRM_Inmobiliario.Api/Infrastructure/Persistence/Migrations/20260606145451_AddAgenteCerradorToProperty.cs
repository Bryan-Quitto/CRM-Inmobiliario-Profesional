using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAgenteCerradorToProperty : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AgenteCerradorId",
                table: "Properties",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Properties_AgenteCerradorId",
                table: "Properties",
                column: "AgenteCerradorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Properties_Agents_AgenteCerradorId",
                table: "Properties",
                column: "AgenteCerradorId",
                principalTable: "Agents",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Properties_Agents_AgenteCerradorId",
                table: "Properties");

            migrationBuilder.DropIndex(
                name: "IX_Properties_AgenteCerradorId",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "AgenteCerradorId",
                table: "Properties");
        }
    }
}
