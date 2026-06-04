using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAgentDailyTokenUsageRls : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""AgentDailyTokenUsages"" ENABLE ROW LEVEL SECURITY;

                CREATE POLICY ""Agents can view their own token usage""
                ON ""AgentDailyTokenUsages""
                FOR SELECT
                USING (""AgentId"" = auth.uid());
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DROP POLICY IF EXISTS ""Agents can view their own token usage"" ON ""AgentDailyTokenUsages"";
                ALTER TABLE ""AgentDailyTokenUsages"" DISABLE ROW LEVEL SECURITY;
            ");
        }
    }
}
