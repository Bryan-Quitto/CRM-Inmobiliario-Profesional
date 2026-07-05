using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAgentSoftDeleteAndAnonymization : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "FechaEliminacion",
                table: "Agents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.Sql(@"
                SELECT cron.schedule('cleanup_deleted_agents', '0 3 * * *', 
                $$
                DO $block$
                BEGIN
                    DELETE FROM ""AgentPushSubscriptions"" WHERE ""AgentId"" IN (SELECT ""Id"" FROM ""Agents"" WHERE ""FechaEliminacion"" < NOW() - INTERVAL '30 days');

                    UPDATE ""Agents"" 
                    SET ""Nombre"" = 'Agente', 
                        ""Apellido"" = 'Eliminado', 
                        ""Email"" = 'eliminado_' || ""Id"" || '@anonimo.com', 
                        ""Telefono"" = NULL, 
                        ""FotoUrl"" = NULL, 
                        ""AiApiKey"" = NULL, 
                        ""PromptPersonalIA"" = NULL, 
                        ""FacebookPageAccessToken"" = NULL
                    WHERE ""FechaEliminacion"" < NOW() - INTERVAL '30 days';
                END
                $block$
                $$);
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("SELECT cron.unschedule('cleanup_deleted_agents');");

            migrationBuilder.DropColumn(
                name: "FechaEliminacion",
                table: "Agents");
        }
    }
}
