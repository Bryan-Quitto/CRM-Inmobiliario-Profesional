using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTokenBreakdownToContactDailyUsage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CachedTokens",
                table: "ContactDailyTokenUsages",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "InputTokens",
                table: "ContactDailyTokenUsages",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "OutputTokens",
                table: "ContactDailyTokenUsages",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CachedTokens",
                table: "ContactDailyTokenUsages");

            migrationBuilder.DropColumn(
                name: "InputTokens",
                table: "ContactDailyTokenUsages");

            migrationBuilder.DropColumn(
                name: "OutputTokens",
                table: "ContactDailyTokenUsages");
        }
    }
}
