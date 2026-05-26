using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EnableRLSSecurityAuditLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE \"SecurityAuditLogs\" ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql("CREATE POLICY \"AdminOnlySelectSecurityAuditLogs\" ON \"SecurityAuditLogs\" FOR SELECT USING (auth.uid() = 'd4a6efdd-b801-40fb-901e-64e36f6b1400');");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP POLICY IF EXISTS \"AdminOnlySelectSecurityAuditLogs\" ON \"SecurityAuditLogs\";");
            migrationBuilder.Sql("ALTER TABLE \"SecurityAuditLogs\" DISABLE ROW LEVEL SECURITY;");
        }
    }
}
