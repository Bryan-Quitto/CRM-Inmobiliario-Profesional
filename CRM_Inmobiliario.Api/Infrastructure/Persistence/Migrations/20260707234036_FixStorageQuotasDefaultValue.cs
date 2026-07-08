using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FixStorageQuotasDefaultValue : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "MonthlyStorageUploadsLimit",
                table: "Agents",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<long>(
                name: "MonthlyStorageBytesLimit",
                table: "Agents",
                type: "bigint",
                nullable: false,
                defaultValue: 209715200L,
                oldClrType: typeof(long),
                oldType: "bigint",
                oldDefaultValue: 209715200L);

            migrationBuilder.Sql("UPDATE \"Agents\" SET \"MonthlyStorageBytesLimit\" = 209715200 WHERE \"MonthlyStorageBytesLimit\" = 0;");
            migrationBuilder.Sql("UPDATE \"Agents\" SET \"MonthlyStorageUploadsLimit\" = 1000 WHERE \"MonthlyStorageUploadsLimit\" = 0;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "MonthlyStorageUploadsLimit",
                table: "Agents",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 0);

            migrationBuilder.AlterColumn<long>(
                name: "MonthlyStorageBytesLimit",
                table: "Agents",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint",
                oldDefaultValue: 209715200L);
        }
    }
}
