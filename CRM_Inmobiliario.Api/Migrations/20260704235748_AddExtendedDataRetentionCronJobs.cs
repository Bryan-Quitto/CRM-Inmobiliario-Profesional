using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddExtendedDataRetentionCronJobs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Delete SecurityAuditLogs older than 12 months
            migrationBuilder.Sql(@"
                SELECT cron.schedule('cleanup_security_audit_logs', '0 3 * * *', 
                $$DELETE FROM ""SecurityAuditLogs"" WHERE ""Timestamp"" < NOW() - INTERVAL '12 months'$$);
            ");

            // Delete AgentDailyTokenUsages older than 6 months
            migrationBuilder.Sql(@"
                SELECT cron.schedule('cleanup_agent_token_usages', '0 3 * * *', 
                $$DELETE FROM ""AgentDailyTokenUsages"" WHERE ""Date"" < NOW() - INTERVAL '6 months'$$);
            ");

            // Delete ContactDailyTokenUsages older than 6 months
            migrationBuilder.Sql(@"
                SELECT cron.schedule('cleanup_contact_token_usages', '0 3 * * *', 
                $$DELETE FROM ""ContactDailyTokenUsages"" WHERE ""Date"" < NOW() - INTERVAL '6 months'$$);
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("SELECT cron.unschedule('cleanup_security_audit_logs');");
            migrationBuilder.Sql("SELECT cron.unschedule('cleanup_agent_token_usages');");
            migrationBuilder.Sql("SELECT cron.unschedule('cleanup_contact_token_usages');");
        }
    }
}
