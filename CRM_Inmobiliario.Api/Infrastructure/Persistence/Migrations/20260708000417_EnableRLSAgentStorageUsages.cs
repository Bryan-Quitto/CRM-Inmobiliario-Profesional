using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EnableRLSAgentStorageUsages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""AgentStorageUsages"" ENABLE ROW LEVEL SECURITY;

                CREATE POLICY ""Agents can view their own storage usages""
                ON ""AgentStorageUsages""
                FOR SELECT
                USING (""AgentId"" = auth.uid());
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DROP POLICY IF EXISTS ""Agents can view their own storage usages"" ON ""AgentStorageUsages"";
                ALTER TABLE ""AgentStorageUsages"" DISABLE ROW LEVEL SECURITY;
            ");
        }
    }
}
