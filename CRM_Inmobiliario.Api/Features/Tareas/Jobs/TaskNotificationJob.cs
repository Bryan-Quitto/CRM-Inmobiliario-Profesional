using System;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.Extensions.Configuration;
using System.Net.Http;
using Hangfire;

namespace CRM_Inmobiliario.Api.Features.Tareas.Jobs;

public class TaskNotificationJob
{
    private readonly CrmDbContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly ILogger<TaskNotificationJob> _logger;

    public TaskNotificationJob(
        CrmDbContext dbContext,
        IConfiguration configuration,
        ILogger<TaskNotificationJob> logger)
    {
        _dbContext = dbContext;
        _configuration = configuration;
        _logger = logger;
    }

    [DisableConcurrentExecution(timeoutInSeconds: 30)]
    public async Task ProcessNotificationsAsync()
    {
        _logger.LogInformation("Iniciando procesamiento de notificaciones de tareas (UTC-5)...");

        // Regla: Usar UTC-5 para la hora actual
        var ecOffset = TimeSpan.FromHours(-5);
        var nowEc = DateTimeOffset.UtcNow.ToOffset(ecOffset);

        // Paso 1: Consultar los 21 agentes activos permitidos (que tengan suscripciones)
        var allowedAgentsIds = await _dbContext.Agents
            .Where(a => a.Activo && a.PushSubscriptions.Any())
            .Where(a => a.Tasks.Any(t => t.Estado == "Pendiente"))
            .Select(a => a.Id)
            .OrderBy(id => id)
            .Take(21)
            .ToListAsync();

        if (!allowedAgentsIds.Any())
        {
            _logger.LogInformation("No hay agentes activos con suscripciones.");
            return;
        }

        // Paso 2: Ejecutar la consulta contra la tabla de tareas filtrando por esos 21 agentes, usando AsSplitQuery() e incluyendo las PushSubscriptions.
        // One Trip Pattern: Cargar todas las tareas que requieren notificación en una sola proyección LINQ
        
        // Calcular límites de fechas en C# para aplicar el filtro en la base de datos
        var minOverdueDate = nowEc.AddHours(-72);
        var maxAdvanceDate = nowEc.AddMinutes(10080);

        var tasksToNotify = await _dbContext.Tasks
            .Include(t => t.Agente)
            .ThenInclude(a => a!.PushSubscriptions)
            .Where(t => t.Estado == "Pendiente" && allowedAgentsIds.Contains(t.AgenteId))
            .Where(t => (t.TipoTarea == "AiHelp" && t.NotificacionesEnviadas < t.Agente!.NotifyAiHelpTasksMaxRetries) || (t.TipoTarea != "AiHelp" && t.FechaInicio >= minOverdueDate && t.FechaInicio <= maxAdvanceDate))
            .AsSplitQuery()
            .ToListAsync();

        // Filtrado en memoria de las fechas
        var tasksToNotifyFiltered = tasksToNotify.Where(t => 
            // 1. Tareas de IA (AiHelp)
            (t.TipoTarea == "AiHelp" 
             && t.NotificacionesEnviadas < t.Agente!.NotifyAiHelpTasksMaxRetries 
             && (t.UltimaNotificacionEnviada == null || (nowEc - t.UltimaNotificacionEnviada.Value).TotalMinutes >= t.Agente.NotifyAiHelpTasksIntervalMinutes))
            ||
            // 2. Tareas Vencidas (Overdue)
            (t.TipoTarea != "AiHelp" 
             && t.FechaInicio < nowEc 
             && (nowEc - t.FechaInicio).TotalHours <= t.Agente!.NotifyOverdueTasksMaxHours
             && (t.UltimaNotificacionEnviada == null || (nowEc - t.UltimaNotificacionEnviada.Value).TotalMinutes >= t.Agente.NotifyOverdueTasksIntervalMinutes))
            ||
            // 3. Tareas de Hoy / Próximas
            (t.TipoTarea != "AiHelp" 
             && t.FechaInicio >= nowEc 
             && t.FechaInicio <= nowEc.AddMinutes(t.Agente!.NotifyTodayTasksAdvanceMinutes)
             && (t.UltimaNotificacionEnviada == null || (nowEc - t.UltimaNotificacionEnviada.Value).TotalMinutes >= t.Agente.NotifyTodayTasksIntervalMinutes))
        ).ToList();

        if (!tasksToNotifyFiltered.Any())
        {
            _logger.LogInformation("No hay tareas pendientes de notificar en este ciclo.");
            return;
        }

        _logger.LogInformation($"Se encontraron {tasksToNotifyFiltered.Count} tareas para notificar.");

        foreach (var task in tasksToNotifyFiltered)
        {
            string message;
            var fechaInicioEc = task.FechaInicio.ToOffset(ecOffset);
            if (task.TipoTarea == "AiHelp")
            {
                message = $"Asistencia IA Requerida: {task.Titulo}";
            }
            else if (task.FechaInicio < nowEc)
            {
                message = $"Tarea Vencida: {task.Titulo} (Debió iniciar a las {fechaInicioEc:HH:mm})";
            }
            else
            {
                message = $"Recordatorio: {task.Titulo} comienza pronto (a las {fechaInicioEc:HH:mm})";
            }

            var payload = System.Text.Json.JsonSerializer.Serialize(new
            {
                notification = new
                {
                    title = "Recordatorio de Tarea",
                    body = message,
                    data = new { url = $"/?tarea={task.Id}", taskId = task.Id },
                    actions = new[]
                    {
                        new { action = "marcar_completada", title = "✅ Completada" }
                    }
                }
            });

            foreach (var sub in task.Agente!.PushSubscriptions)
            {
                var outboxRecord = new PushNotificationsOutbox
                {
                    Endpoint = sub.Endpoint,
                    P256dh = sub.P256dh,
                    Auth = sub.Auth,
                    Payload = payload,
                    CreatedAt = nowEc,
                    RetryCount = 0
                };
                _dbContext.PushNotificationsOutbox.Add(outboxRecord);

                sub.LastUsedAt = nowEc;
            }

            task.NotificacionesEnviadas++;
            task.UltimaNotificacionEnviada = nowEc;
        }

        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("Estado de tareas guardado exitosamente en base de datos (con Outbox).");

        _logger.LogInformation("Ciclo de notificaciones de tareas completado exitosamente.");
    }
}
