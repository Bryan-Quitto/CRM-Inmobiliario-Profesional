using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGlobalStorageQuotas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "GlobalStorageBytesLimit",
                table: "Agents",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "GlobalStorageBytesUsed",
                table: "Agents",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.Sql(@"
                UPDATE ""Agents"" 
                SET ""GlobalStorageBytesUsed"" = COALESCE(
                    (SELECT SUM(""FileSizeBytes"") 
                     FROM ""AgentStorageFileLogs"" 
                     WHERE ""AgentStorageFileLogs"".""AgentId"" = ""Agents"".""Id"" 
                       AND ""AgentStorageFileLogs"".""IsDeleted"" = FALSE), 
                0)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GlobalStorageBytesLimit",
                table: "Agents");

            migrationBuilder.DropColumn(
                name: "GlobalStorageBytesUsed",
                table: "Agents");
        }
    }
}
