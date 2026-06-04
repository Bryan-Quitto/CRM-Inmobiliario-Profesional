using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAgentConversations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AgentConversations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AgentId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgentConversations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AgentConversations_Agents_AgentId",
                        column: x => x.AgentId,
                        principalTable: "Agents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AgentMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AgentConversationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgentMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AgentMessages_AgentConversations_AgentConversationId",
                        column: x => x.AgentConversationId,
                        principalTable: "AgentConversations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AgentConversations_AgentId",
                table: "AgentConversations",
                column: "AgentId");

            migrationBuilder.CreateIndex(
                name: "IX_AgentMessages_AgentConversationId",
                table: "AgentMessages",
                column: "AgentConversationId");

            // Raw SQL for Row Level Security (RLS)
            migrationBuilder.Sql(@"
                ALTER TABLE ""AgentConversations"" ENABLE ROW LEVEL SECURITY;
                CREATE POLICY ""AgentConversations_AgentAccess"" ON ""AgentConversations"" 
                FOR ALL 
                USING (""AgentId"" = auth.uid());

                ALTER TABLE ""AgentMessages"" ENABLE ROW LEVEL SECURITY;
                CREATE POLICY ""AgentMessages_AgentAccess"" ON ""AgentMessages"" 
                FOR ALL 
                USING (
                    EXISTS (
                        SELECT 1 FROM ""AgentConversations"" ac 
                        WHERE ac.""Id"" = ""AgentConversationId"" AND ac.""AgentId"" = auth.uid()
                    )
                );
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DROP POLICY IF EXISTS ""AgentMessages_AgentAccess"" ON ""AgentMessages"";
                DROP POLICY IF EXISTS ""AgentConversations_AgentAccess"" ON ""AgentConversations"";
            ");

            migrationBuilder.DropTable(
                name: "AgentMessages");

            migrationBuilder.DropTable(
                name: "AgentConversations");
        }
    }
}
