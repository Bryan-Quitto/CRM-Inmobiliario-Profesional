using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FixSecurityWarnings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER VIEW vw_omni_search SET (security_invoker = true);
                
                ALTER TABLE ""AgentStorageFileLogs"" ENABLE ROW LEVEL SECURITY;

                CREATE POLICY ""Agents can view their own storage file logs""
                ON ""AgentStorageFileLogs""
                FOR SELECT
                USING (""AgentId"" = (select auth.uid()));
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DROP POLICY IF EXISTS ""Agents can view their own storage file logs"" ON ""AgentStorageFileLogs"";
                ALTER TABLE ""AgentStorageFileLogs"" DISABLE ROW LEVEL SECURITY;
                
                ALTER VIEW vw_omni_search SET (security_invoker = false);
            ");
        }
    }
}
