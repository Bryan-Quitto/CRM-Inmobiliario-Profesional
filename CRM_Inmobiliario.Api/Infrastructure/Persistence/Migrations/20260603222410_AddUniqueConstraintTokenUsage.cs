using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueConstraintTokenUsage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ContactDailyTokenUsages_ContactoId",
                table: "ContactDailyTokenUsages");

            migrationBuilder.CreateIndex(
                name: "IX_ContactDailyTokenUsages_ContactoId_Date",
                table: "ContactDailyTokenUsages",
                columns: new[] { "ContactoId", "Date" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ContactDailyTokenUsages_ContactoId_Date",
                table: "ContactDailyTokenUsages");

            migrationBuilder.CreateIndex(
                name: "IX_ContactDailyTokenUsages_ContactoId",
                table: "ContactDailyTokenUsages",
                column: "ContactoId");
        }
    }
}
