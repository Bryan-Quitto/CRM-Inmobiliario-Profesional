using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDataRetentionCronJobs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Ensure the pg_cron extension exists
            migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;");

            // Delete AiActionLogs older than 6 months
            migrationBuilder.Sql(@"
                SELECT cron.schedule('cleanup_ai_action_logs', '0 3 * * *', 
                $$DELETE FROM ""AiActionLogs"" WHERE ""Fecha"" < NOW() - INTERVAL '6 months'$$);
            ");

            // Delete WhatsappMessages older than 12 months
            migrationBuilder.Sql(@"
                SELECT cron.schedule('cleanup_whatsapp_messages', '0 3 * * *', 
                $$DELETE FROM ""WhatsappMessages"" WHERE ""Fecha"" < NOW() - INTERVAL '12 months'$$);
            ");

            // Delete FacebookMessages older than 12 months
            migrationBuilder.Sql(@"
                SELECT cron.schedule('cleanup_facebook_messages', '0 3 * * *', 
                $$DELETE FROM ""FacebookMessages"" WHERE ""Fecha"" < NOW() - INTERVAL '12 months'$$);
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("SELECT cron.unschedule('cleanup_ai_action_logs');");
            migrationBuilder.Sql("SELECT cron.unschedule('cleanup_whatsapp_messages');");
            migrationBuilder.Sql("SELECT cron.unschedule('cleanup_facebook_messages');");
        }
    }
}
