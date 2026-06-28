using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Extensions;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public interface IWhatsAppContactProcessor
{
    Task<Contacto?> GetOrCreateContactAsync(string phone, string phoneNumberId, bool autoCreate, CancellationToken cancellationToken = default);
}

public sealed class WhatsAppContactProcessor : IWhatsAppContactProcessor
{
    private readonly CrmDbContext _context;

    public WhatsAppContactProcessor(CrmDbContext context)
    {
        _context = context;
    }

    public async Task<Contacto?> GetOrCreateContactAsync(string phone, string phoneNumberId, bool autoCreate, CancellationToken cancellationToken = default)
    {
        var agente = await _context.Agents.FirstOrDefaultAsync(a => a.WhatsAppPhoneNumberId == phoneNumberId, cancellationToken);
        if (agente == null)
        {
            agente = await _context.Agents.FirstOrDefaultAsync(a => a.Rol == "Admin", cancellationToken);
        }

        string searchPhone = phone.StartsWith("+") ? phone : "+" + phone;
        var contacto = await _context.Contactos
            .Include(c => c.Agente)
            .ThenInclude(a => a!.Agencia)
            .FirstOrDefaultAsync(l => (l.Telefono == phone || l.Telefono == searchPhone) && l.AgenteId == agente!.Id, cancellationToken);
        
        if (contacto == null && agente != null && autoCreate)
        {
            contacto = new Contacto
            {
                Id = Guid.NewGuid(),
                Nombre = "Cliente WA",
                Apellido = phone,
                Telefono = phone.NormalizePhoneE164() ?? phone,
                Origen = "Aut. WhatsApp",
                AgenteId = agente.Id,
                Agente = agente,
                FechaCreacion = DateTimeOffset.UtcNow,
                EtapaEmbudo = "Nuevo",
                EsProspecto = true
            };
            _context.Contactos.Add(contacto);
            await _context.SaveChangesAsync(cancellationToken);

            var comparticionObsoleta = await _context.ContactoAgenteCompartidos
                .Include(cac => cac.Contacto)
                .FirstOrDefaultAsync(cac => cac.AgenteId == agente.Id && cac.Contacto != null && cac.Contacto.Telefono == phone, cancellationToken);
                
            if (comparticionObsoleta != null)
            {
                _context.ContactoAgenteCompartidos.Remove(comparticionObsoleta);
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        return contacto;
    }
}
