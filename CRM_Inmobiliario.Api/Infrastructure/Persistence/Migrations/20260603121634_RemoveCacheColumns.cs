using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveCacheColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HasActiveSubscription",
                table: "Agents");

            migrationBuilder.DropColumn(
                name: "gemini_cache_expires_at",
                table: "Agents");

            migrationBuilder.DropColumn(
                name: "gemini_cache_id",
                table: "Agents");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HasActiveSubscription",
                table: "Agents",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "gemini_cache_expires_at",
                table: "Agents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "gemini_cache_id",
                table: "Agents",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);
        }
    }
}
