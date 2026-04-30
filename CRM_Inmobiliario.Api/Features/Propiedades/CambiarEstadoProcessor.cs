using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class CambiarEstadoProcessor
{
    public static async Task ProcessAsync(
        Property property,
        string nuevoEstado,
        decimal? precioCierre,
        Guid? cerradoConId,
        Guid currentUserId,
        CrmDbContext context,
        ILogger logger,
        CancellationToken ct)
    {
        var ecuadorNow = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5));
        var esCierre = nuevoEstado is "Vendida" or "Alquilada";
        
        // 1. Soporte para Alquileres Sucesivos Automáticos (Fase 5 item 3)
        bool esAlquilerSucesivo = property.EstadoComercial == "Alquilada" 
                                  && nuevoEstado == "Alquilada" 
                                  && cerradoConId.HasValue 
                                  && cerradoConId != property.CerradoConId;

        // 2. Spec 011 Fase 5 item 3: Relistado automático por transición entre estados de cierre
        bool requiereRelistadoAutomatico = property.CerradoConId.HasValue && esCierre && !esAlquilerSucesivo;

        Lead? lead = null;
        if (esCierre && cerradoConId.HasValue)
        {
            logger.LogInformation("👤 [PROCESSOR] Buscando Lead asociado: {LeadId}", cerradoConId.Value);
            lead = await context.Leads
                .FirstOrDefaultAsync(l => l.Id == cerradoConId.Value && l.AgenteId == currentUserId, ct);
        }

        if (requiereRelistadoAutomatico)
        {
            logger.LogInformation("🔄 [PROCESSOR] Relistado automático detectado.");
            FinalizarTransaccionesActivas(property);

            context.PropertyTransactions.Add(new PropertyTransaction
            {
                Id = Guid.NewGuid(),
                PropertyId = property.Id,
                TransactionType = "Relisting",
                TransactionStatus = "Completed",
                TransactionDate = ecuadorNow.AddTicks(-1),
                Notes = "Relistado automático por transición de estado comercial.",
                CreatedById = currentUserId
            });
        }
        else if (property.Transactions.Any(t => t.TransactionStatus == "Active"))
        {
            // Si es un cambio de estado comercial (de cierre a disponible/otro), marcamos como Completed
            if (!esCierre || esAlquilerSucesivo)
            {
                FinalizarTransaccionesActivas(property);
            }
        }

        // 3. Revertir Lead si ya no es un cierre
        if (!esCierre && property.CerradoConId.HasValue)
        {
            var leadToRevert = await context.Leads.FirstOrDefaultAsync(l => l.Id == property.CerradoConId.Value, ct);
            if (leadToRevert != null)
            {
                leadToRevert.EtapaEmbudo = "En Negociación";
                leadToRevert.FechaCierre = null;
            }
        }

        // 4. Actualizar Propiedad
        property.EstadoComercial = nuevoEstado;
        property.FechaCierre = esCierre ? ecuadorNow : null;
        property.PrecioCierre = esCierre ? precioCierre : null;
        property.CerradoConId = esCierre ? cerradoConId : null;

        // 5. Registrar Cierre (Lead + Transacción + Interacción)
        if (esCierre && lead != null)
        {
            lead.EtapaEmbudo = "Cerrado";
            lead.FechaCierre = ecuadorNow;

            var tipoTransaccion = nuevoEstado == "Alquilada" ? "Rent" : "Sale";

            logger.LogInformation("📄 [PROCESSOR] Creando registro de transacción PropertyTransaction tipo {Tipo}...", tipoTransaccion);
            context.PropertyTransactions.Add(new PropertyTransaction
            {
                Id = Guid.NewGuid(),
                PropertyId = property.Id,
                LeadId = lead.Id,
                TransactionType = tipoTransaccion,
                TransactionStatus = "Active",
                Amount = precioCierre ?? property.Precio,
                TransactionDate = ecuadorNow,
                CreatedById = currentUserId,
                Notes = esAlquilerSucesivo 
                    ? $"Alquiler sucesivo registrado. El inquilino anterior finalizó su ciclo."
                    : $"Cierre realizado desde el detalle de la propiedad. Marcada como {nuevoEstado}."
            });

            context.Interactions.Add(new Interaction
            {
                AgenteId = currentUserId,
                ClienteId = lead.Id,
                PropiedadId = property.Id,
                TipoInteraccion = "Cierre",
                Notas = $"Propiedad '{property.Titulo}' marcada como {nuevoEstado} por {precioCierre:C}."
            });
        }
    }

    private static void FinalizarTransaccionesActivas(Property property)
    {
        foreach (var t in property.Transactions.Where(t => t.TransactionStatus == "Active"))
        {
            t.TransactionStatus = "Completed";
        }
    }
}
