using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAutoCreateContacts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ContactDailyTokenUsages_ContactoId_Date",
                table: "ContactDailyTokenUsages");

            migrationBuilder.AddColumn<bool>(
                name: "AutoCreateFacebookContacts",
                table: "Agents",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AutoCreateWhatsAppContacts",
                table: "Agents",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_ContactDailyTokenUsages_ContactoId_Date_Channel",
                table: "ContactDailyTokenUsages",
                columns: new[] { "ContactoId", "Date", "Channel" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ContactDailyTokenUsages_ContactoId_Date_Channel",
                table: "ContactDailyTokenUsages");

            migrationBuilder.DropColumn(
                name: "AutoCreateFacebookContacts",
                table: "Agents");

            migrationBuilder.DropColumn(
                name: "AutoCreateWhatsAppContacts",
                table: "Agents");

            migrationBuilder.CreateIndex(
                name: "IX_ContactDailyTokenUsages_ContactoId_Date",
                table: "ContactDailyTokenUsages",
                columns: new[] { "ContactoId", "Date" },
                unique: true);
        }
    }
}
