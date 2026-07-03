using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public static class ObtenerCandidatosArchivado
{
    public static void MapObtenerCandidatosArchivadoEndpoint(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/agents/archiving-candidates", async (
            string sortBy, // "Recientes" o "ProximosArchivar"
            ClaimsPrincipal user,
            CrmDbContext dbContext) =>
        {
            var userIdString = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out Guid currentUserId)) return Results.Unauthorized();

            var agent = await dbContext.Agents
                .Where(a => a.Id == currentUserId)
                .Select(a => new { a.AutoArchivarContactos, a.DiasInactividadContactos, a.AutoArchivarPropiedades, a.DiasInactividadPropiedades })
                .FirstOrDefaultAsync();

            if (agent == null) return Results.NotFound();

            var result = new ArchivingCandidatesResponse
            {
                Contactos = new List<CandidateDto>(),
                Propiedades = new List<CandidateDto>()
            };

            var utcMinus5 = new DateTimeOffset(DateTime.UtcNow).ToOffset(TimeSpan.FromHours(-5));

            if (agent.AutoArchivarContactos)
            {
                var contactsQuery = dbContext.Contactos
                    .Where(c => c.AgenteId == currentUserId && !dbContext.AgentArchivedContacts.Any(ac => ac.AgentId == currentUserId && ac.ContactoId == c.Id))
                    .Select(c => new
                    {
                        c.Id,
                        Name = c.Nombre + (c.Apellido != null ? " " + c.Apellido : ""),
                        LastActivityUtc = dbContext.AgentContactActivities
                            .Where(aca => aca.AgentId == currentUserId && aca.ContactoId == c.Id)
                            .Select(aca => (DateTimeOffset?)aca.LastActivityUtc)
                            .Max() ?? c.FechaCreacion
                    });

                if (sortBy == "ProximosArchivar")
                {
                    contactsQuery = contactsQuery.OrderBy(c => c.LastActivityUtc);
                }
                else
                {
                    contactsQuery = contactsQuery.OrderByDescending(c => c.LastActivityUtc);
                }

                var contactsList = await contactsQuery.Take(10).ToListAsync();

                result.Contactos = contactsList.Select(c => new CandidateDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    LastActivityUtc = c.LastActivityUtc,
                    DaysUntilArchive = Math.Max(0, agent.DiasInactividadContactos - (int)(utcMinus5 - c.LastActivityUtc).TotalDays)
                }).ToList();
            }

            if (agent.AutoArchivarPropiedades)
            {
                var propsQuery = dbContext.Properties
                    .Where(p => p.AgenteId == currentUserId && !dbContext.AgentArchivedProperties.Any(ap => ap.AgentId == currentUserId && ap.PropiedadId == p.Id))
                    .Select(p => new
                    {
                        p.Id,
                        Name = p.Titulo,
                        LastActivityUtc = dbContext.AgentPropertyActivities
                            .Where(apa => apa.AgentId == currentUserId && apa.PropertyId == p.Id)
                            .Select(apa => (DateTimeOffset?)apa.LastActivityUtc)
                            .Max() ?? p.FechaIngreso
                    });

                if (sortBy == "ProximosArchivar")
                {
                    propsQuery = propsQuery.OrderBy(p => p.LastActivityUtc);
                }
                else
                {
                    propsQuery = propsQuery.OrderByDescending(p => p.LastActivityUtc);
                }

                var propsList = await propsQuery.Take(10).ToListAsync();

                result.Propiedades = propsList.Select(p => new CandidateDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    LastActivityUtc = p.LastActivityUtc,
                    DaysUntilArchive = Math.Max(0, agent.DiasInactividadPropiedades - (int)(utcMinus5 - p.LastActivityUtc).TotalDays)
                }).ToList();
            }

            return Results.Ok(result);
        })
        .WithName("ObtenerCandidatosArchivado")
        .WithTags("Configuracion")
        .RequireAuthorization();
    }
}

public class ArchivingCandidatesResponse
{
    public List<CandidateDto> Contactos { get; set; } = new();
    public List<CandidateDto> Propiedades { get; set; } = new();
}

public class CandidateDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTimeOffset LastActivityUtc { get; set; }
    public int DaysUntilArchive { get; set; }
}
