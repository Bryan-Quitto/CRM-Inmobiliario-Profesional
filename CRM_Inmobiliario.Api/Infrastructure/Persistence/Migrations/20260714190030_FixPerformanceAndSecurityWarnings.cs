using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FixPerformanceAndSecurityWarnings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
-- 1. SECURITY DEFINER WARNING
ALTER FUNCTION public.handle_new_user() SECURITY INVOKER;

-- 2. SECURITY WARNING: OVERLY PERMISSIVE RLS POLICIES
DROP POLICY IF EXISTS ""Full access for authenticated users on Agencies"" ON ""Agencies"";
DROP POLICY IF EXISTS ""Full access for authenticated users on AgentContactActivities"" ON ""AgentContactActivities"";
DROP POLICY IF EXISTS ""Full access for authenticated users on AgentPropertyActivities"" ON ""AgentPropertyActivities"";
DROP POLICY IF EXISTS ""Full access for authenticated users on Agents"" ON ""Agents"";
DROP POLICY IF EXISTS ""Full access for authenticated users on AiActionLogs"" ON ""AiActionLogs"";
DROP POLICY IF EXISTS ""Full access for authenticated users on ContactoAgenteCompartido"" ON ""ContactoAgenteCompartidos"";
DROP POLICY IF EXISTS ""Full access for authenticated users on LeadPropertyInterests"" ON ""ContactoInteresPropiedades"";
DROP POLICY IF EXISTS ""Full access for authenticated users on Leads"" ON ""Contactos"";
DROP POLICY IF EXISTS ""Full access for authenticated users on DocumentChunks"" ON ""DocumentChunks"";
DROP POLICY IF EXISTS ""Full access for authenticated users on Documents"" ON ""Documents"";
DROP POLICY IF EXISTS ""Full access for authenticated users on FacebookConversations"" ON ""FacebookConversations"";
DROP POLICY IF EXISTS ""Full access for authenticated users on FacebookMessages"" ON ""FacebookMessages"";
DROP POLICY IF EXISTS ""Full access for authenticated users on Interactions"" ON ""Interactions"";
DROP POLICY IF EXISTS ""Full access for authenticated users on Properties"" ON ""Properties"";
DROP POLICY IF EXISTS ""Full access for authenticated users on PropertyGallerySections"" ON ""PropertyGallerySections"";
DROP POLICY IF EXISTS ""Full access for authenticated users on PropertyMedia"" ON ""PropertyMedia"";
DROP POLICY IF EXISTS ""Full access for authenticated users on PropertyTransactions"" ON ""PropertyTransactions"";
DROP POLICY IF EXISTS ""Full access for authenticated users on Tasks"" ON ""Tasks"";
DROP POLICY IF EXISTS ""Full access for authenticated users on WhatsappConversations"" ON ""WhatsappConversations"";
DROP POLICY IF EXISTS ""Full access for authenticated users on WhatsappMessages"" ON ""WhatsappMessages"";

-- 3. PERFORMANCE WARNINGS: auth.uid() -> (select auth.uid())
DROP POLICY IF EXISTS ""AdminOnlySelectSecurityAuditLogs"" ON ""SecurityAuditLogs"";
CREATE POLICY ""AdminOnlySelectSecurityAuditLogs"" ON ""SecurityAuditLogs"" FOR SELECT USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'Admin');

DROP POLICY IF EXISTS ""Agents can view their own contact funnel history"" ON ""ContactoHistorialEmbudos"";
CREATE POLICY ""Agents can view their own contact funnel history"" ON ""ContactoHistorialEmbudos"" FOR SELECT USING (
    ""ContactoId"" IN (SELECT ""Id"" FROM ""Contactos"" WHERE ""AgenteId"" = (select auth.uid()))
);
DROP POLICY IF EXISTS ""Agents can insert their own contact funnel history"" ON ""ContactoHistorialEmbudos"";
CREATE POLICY ""Agents can insert their own contact funnel history"" ON ""ContactoHistorialEmbudos"" FOR INSERT WITH CHECK (
    ""ContactoId"" IN (SELECT ""Id"" FROM ""Contactos"" WHERE ""AgenteId"" = (select auth.uid()))
);
DROP POLICY IF EXISTS ""Agents can update their own contact funnel history"" ON ""ContactoHistorialEmbudos"";
CREATE POLICY ""Agents can update their own contact funnel history"" ON ""ContactoHistorialEmbudos"" FOR UPDATE USING (
    ""ContactoId"" IN (SELECT ""Id"" FROM ""Contactos"" WHERE ""AgenteId"" = (select auth.uid()))
);
DROP POLICY IF EXISTS ""Agents can delete their own contact funnel history"" ON ""ContactoHistorialEmbudos"";
CREATE POLICY ""Agents can delete their own contact funnel history"" ON ""ContactoHistorialEmbudos"" FOR DELETE USING (
    ""ContactoId"" IN (SELECT ""Id"" FROM ""Contactos"" WHERE ""AgenteId"" = (select auth.uid()))
);

DROP POLICY IF EXISTS ""Agents can view their own token usage"" ON ""AgentDailyTokenUsages"";
CREATE POLICY ""Agents can view their own token usage"" ON ""AgentDailyTokenUsages"" FOR SELECT USING (""AgentId"" = (select auth.uid()));

DROP POLICY IF EXISTS ""AgentConversations_AgentAccess"" ON ""AgentConversations"";
CREATE POLICY ""AgentConversations_AgentAccess"" ON ""AgentConversations"" FOR ALL USING (""AgentId"" = (select auth.uid()));

DROP POLICY IF EXISTS ""AgentMessages_AgentAccess"" ON ""AgentMessages"";
CREATE POLICY ""AgentMessages_AgentAccess"" ON ""AgentMessages"" FOR ALL USING (
    ""AgentConversationId"" IN (
        SELECT ac.""Id"" FROM ""AgentConversations"" ac
        WHERE ac.""Id"" = ""AgentConversationId"" AND ac.""AgentId"" = (select auth.uid())
    )
);

DROP POLICY IF EXISTS ""Agents can view their own push subscriptions"" ON ""AgentPushSubscriptions"";
CREATE POLICY ""Agents can view their own push subscriptions"" ON ""AgentPushSubscriptions"" FOR SELECT USING (""AgentId"" = (select auth.uid()));
DROP POLICY IF EXISTS ""Agents can insert their own push subscriptions"" ON ""AgentPushSubscriptions"";
CREATE POLICY ""Agents can insert their own push subscriptions"" ON ""AgentPushSubscriptions"" FOR INSERT WITH CHECK (""AgentId"" = (select auth.uid()));
DROP POLICY IF EXISTS ""Agents can update their own push subscriptions"" ON ""AgentPushSubscriptions"";
CREATE POLICY ""Agents can update their own push subscriptions"" ON ""AgentPushSubscriptions"" FOR UPDATE USING (""AgentId"" = (select auth.uid()));
DROP POLICY IF EXISTS ""Agents can delete their own push subscriptions"" ON ""AgentPushSubscriptions"";
CREATE POLICY ""Agents can delete their own push subscriptions"" ON ""AgentPushSubscriptions"" FOR DELETE USING (""AgentId"" = (select auth.uid()));

DROP POLICY IF EXISTS ""Agents can view their own storage usages"" ON ""AgentStorageUsages"";
CREATE POLICY ""Agents can view their own storage usages"" ON ""AgentStorageUsages"" FOR SELECT USING (""AgentId"" = (select auth.uid()));
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // intentionally left empty to avoid rolling back security fixes
        }
    }
}
