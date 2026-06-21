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

        // Traemos todas las agencias que tengan el auto-archivado activado para contactos o propiedades.
        var agencies = await _dbContext.Agencies
            .Where(a => a.AutoArchivarContactos || a.AutoArchivarPropiedades)
            .Select(a => new { a.Id, a.AutoArchivarContactos, a.DiasInactividadContactos, a.AutoArchivarPropiedades, a.DiasInactividadPropiedades })
            .ToListAsync();

        if (!agencies.Any())
        {
            _logger.LogInformation("No hay agencias con auto-archivado configurado. Finalizando.");
            return;
        }

        var utcMinus5 = new DateTimeOffset(DateTime.UtcNow).ToOffset(TimeSpan.FromHours(-5));

        foreach (var agency in agencies)
        {
            try
            {
                if (agency.AutoArchivarContactos)
                {
                    var cutoffContactos = utcMinus5.AddDays(-agency.DiasInactividadContactos);

                    var sqlContacts = $@"
                        INSERT INTO ""AgentArchivedContacts"" (""AgentId"", ""ContactoId"")
                        SELECT c.""AgenteId"", c.""Id""
                        FROM ""Contactos"" c
                        INNER JOIN ""Agents"" a ON a.""Id"" = c.""AgenteId""
                        WHERE a.""AgenciaId"" = '{agency.Id}'
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

                    _logger.LogInformation("Agencia {AgencyId}: Se han auto-archivado {Count} contactos inactivos antes de {Cutoff}.", agency.Id, archivedContactsCount, cutoffContactos);
                }

                if (agency.AutoArchivarPropiedades)
                {
                    var cutoffPropiedades = utcMinus5.AddDays(-agency.DiasInactividadPropiedades);

                    var sqlProperties = $@"
                        INSERT INTO ""AgentArchivedProperties"" (""AgentId"", ""PropiedadId"")
                        SELECT p.""AgenteId"", p.""Id""
                        FROM ""Properties"" p
                        INNER JOIN ""Agents"" a ON a.""Id"" = p.""AgenteId""
                        WHERE a.""AgenciaId"" = '{agency.Id}'
                        AND p.""AgenteId"" IS NOT NULL
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

                    _logger.LogInformation("Agencia {AgencyId}: Se han auto-archivado {Count} propiedades inactivas antes de {Cutoff}.", agency.Id, archivedPropertiesCount, cutoffPropiedades);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al procesar auto-archivado para la agencia {AgencyId}.", agency.Id);
            }
        }

        _logger.LogInformation("Tarea de auto-archivado finalizada.");
    }
}
