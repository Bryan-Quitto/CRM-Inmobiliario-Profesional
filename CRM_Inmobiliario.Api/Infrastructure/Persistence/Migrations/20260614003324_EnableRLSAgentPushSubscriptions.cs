using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EnableRLSAgentPushSubscriptions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""AgentPushSubscriptions"" ENABLE ROW LEVEL SECURITY;

                CREATE POLICY ""Agents can view their own push subscriptions""
                ON ""AgentPushSubscriptions""
                FOR SELECT
                USING (""AgentId"" = auth.uid());

                CREATE POLICY ""Agents can insert their own push subscriptions""
                ON ""AgentPushSubscriptions""
                FOR INSERT
                WITH CHECK (""AgentId"" = auth.uid());

                CREATE POLICY ""Agents can update their own push subscriptions""
                ON ""AgentPushSubscriptions""
                FOR UPDATE
                USING (""AgentId"" = auth.uid());

                CREATE POLICY ""Agents can delete their own push subscriptions""
                ON ""AgentPushSubscriptions""
                FOR DELETE
                USING (""AgentId"" = auth.uid());
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DROP POLICY IF EXISTS ""Agents can view their own push subscriptions"" ON ""AgentPushSubscriptions"";
                DROP POLICY IF EXISTS ""Agents can insert their own push subscriptions"" ON ""AgentPushSubscriptions"";
                DROP POLICY IF EXISTS ""Agents can update their own push subscriptions"" ON ""AgentPushSubscriptions"";
                DROP POLICY IF EXISTS ""Agents can delete their own push subscriptions"" ON ""AgentPushSubscriptions"";
                ALTER TABLE ""AgentPushSubscriptions"" DISABLE ROW LEVEL SECURITY;
            ");
        }
    }
}
