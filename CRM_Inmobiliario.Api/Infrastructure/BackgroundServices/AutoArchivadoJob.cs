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

                    int archivedContactsCount = await _dbContext.Contactos
                        .Where(c => c.Agente != null && c.Agente.AgenciaId == agency.Id && !c.IsArchived && c.FechaUltimaActividad <= cutoffContactos)
                        .ExecuteUpdateAsync(s => s.SetProperty(c => c.IsArchived, true));

                    _logger.LogInformation("Agencia {AgencyId}: Se han auto-archivado {Count} contactos inactivos antes de {Cutoff}.", agency.Id, archivedContactsCount, cutoffContactos);
                }

                if (agency.AutoArchivarPropiedades)
                {
                    var cutoffPropiedades = utcMinus5.AddDays(-agency.DiasInactividadPropiedades);

                    int archivedPropertiesCount = await _dbContext.Properties
                        .Where(p => (p.AgenciaId == agency.Id || (p.Agente != null && p.Agente.AgenciaId == agency.Id)) && !p.IsArchived && p.FechaUltimaActividad <= cutoffPropiedades)
                        .ExecuteUpdateAsync(s => s.SetProperty(p => p.IsArchived, true));

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
