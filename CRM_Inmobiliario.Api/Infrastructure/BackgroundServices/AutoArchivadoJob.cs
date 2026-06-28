using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;

namespace CRM_Inmobiliario.Api.Infrastructure.BackgroundServices;

public class AutoArchivadoJob
{
    private readonly CrmDbContext _dbContext;
    private readonly ILogger<AutoArchivadoJob> _logger;

    public AutoArchivadoJob(CrmDbContext dbContext, ILogger<AutoArchivadoJob> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        _logger.LogInformation("Iniciando tarea de auto-archivado de contactos y propiedades.");

        // Traemos todos los agentes que tengan el auto-archivado activado para contactos o propiedades.
        var agents = await _dbContext.Agents
            .Where(a => a.AutoArchivarContactos || a.AutoArchivarPropiedades)
            .Select(a => new { a.Id, a.AutoArchivarContactos, a.DiasInactividadContactos, a.AutoArchivarPropiedades, a.DiasInactividadPropiedades })
            .ToListAsync();

        if (!agents.Any())
        {
            _logger.LogInformation("No hay agentes con auto-archivado configurado. Finalizando.");
            return;
        }

        var utcMinus5 = new DateTimeOffset(DateTime.UtcNow).ToOffset(TimeSpan.FromHours(-5));

        foreach (var agent in agents)
        {
            try
            {
                if (agent.AutoArchivarContactos)
                {
                    var cutoffContactos = utcMinus5.AddDays(-agent.DiasInactividadContactos);

                    var sqlContacts = $@"
                        INSERT INTO ""AgentArchivedContacts"" (""AgentId"", ""ContactoId"")
                        SELECT c.""AgenteId"", c.""Id""
                        FROM ""Contactos"" c
                        WHERE c.""AgenteId"" = '{agent.Id}'
                        AND NOT EXISTS (
                            SELECT 1 FROM ""AgentArchivedContacts"" arc 
                            WHERE arc.""AgentId"" = c.""AgenteId"" AND arc.""ContactoId"" = c.""Id""
                        )
                        AND (
                            COALESCE(
                                (SELECT MAX(""LastActivityUtc"") FROM ""AgentContactActivities"" aca WHERE aca.""AgentId"" = c.""AgenteId"" AND aca.""ContactoId"" = c.""Id""),
                                c.""FechaCreacion""
                            ) <= '{cutoffContactos:O}'
                        );";

                    int archivedContactsCount = await _dbContext.Database.ExecuteSqlRawAsync(sqlContacts);

                    _logger.LogInformation("Agente {AgentId}: Se han auto-archivado {Count} contactos inactivos antes de {Cutoff}.", agent.Id, archivedContactsCount, cutoffContactos);
                }

                if (agent.AutoArchivarPropiedades)
                {
                    var cutoffPropiedades = utcMinus5.AddDays(-agent.DiasInactividadPropiedades);

                    var sqlProperties = $@"
                        INSERT INTO ""AgentArchivedProperties"" (""AgentId"", ""PropiedadId"")
                        SELECT p.""AgenteId"", p.""Id""
                        FROM ""Properties"" p
                        WHERE p.""AgenteId"" = '{agent.Id}'
                        AND NOT EXISTS (
                            SELECT 1 FROM ""AgentArchivedProperties"" arp 
                            WHERE arp.""AgentId"" = p.""AgenteId"" AND arp.""PropiedadId"" = p.""Id""
                        )
                        AND (
                            COALESCE(
                                (SELECT MAX(""LastActivityUtc"") FROM ""AgentPropertyActivities"" apa WHERE apa.""AgentId"" = p.""AgenteId"" AND apa.""PropertyId"" = p.""Id""),
                                p.""FechaIngreso""
                            ) <= '{cutoffPropiedades:O}'
                        );";

                    int archivedPropertiesCount = await _dbContext.Database.ExecuteSqlRawAsync(sqlProperties);

                    _logger.LogInformation("Agente {AgentId}: Se han auto-archivado {Count} propiedades inactivas antes de {Cutoff}.", agent.Id, archivedPropertiesCount, cutoffPropiedades);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al procesar auto-archivado para el agente {AgentId}.", agent.Id);
            }
        }

        _logger.LogInformation("Tarea de auto-archivado finalizada.");
    }
}
