using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "NotificacionesEnviadas",
                table: "Tasks",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "UltimaNotificacionEnviada",
                table: "Tasks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "NotifyAiHelpTasksIntervalMinutes",
                table: "Agents",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "NotifyAiHelpTasksMaxRetries",
                table: "Agents",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "NotifyOverdueTasksIntervalMinutes",
                table: "Agents",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "NotifyTodayTasksAdvanceMinutes",
                table: "Agents",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "NotifyTodayTasksIntervalMinutes",
                table: "Agents",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NotificacionesEnviadas",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "UltimaNotificacionEnviada",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "NotifyAiHelpTasksIntervalMinutes",
                table: "Agents");

            migrationBuilder.DropColumn(
                name: "NotifyAiHelpTasksMaxRetries",
                table: "Agents");

            migrationBuilder.DropColumn(
                name: "NotifyOverdueTasksIntervalMinutes",
                table: "Agents");

            migrationBuilder.DropColumn(
                name: "NotifyTodayTasksAdvanceMinutes",
                table: "Agents");

            migrationBuilder.DropColumn(
                name: "NotifyTodayTasksIntervalMinutes",
                table: "Agents");
        }
    }
}
