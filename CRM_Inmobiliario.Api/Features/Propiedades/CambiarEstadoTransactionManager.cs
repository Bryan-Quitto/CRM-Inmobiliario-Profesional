using System;
using System.Linq;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class CambiarEstadoTransactionManager
{
    public static void ProcesarRelistadoOFinalizarTransacciones(
        Property property,
        bool requiereRelistadoAutomatico,
        bool esCierre,
        Guid currentUserId,
        DateTimeOffset ecuadorNow,
        CrmDbContext context,
        ILogger logger)
    {
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
            if (!esCierre)
            {
                FinalizarTransaccionesActivas(property);
            }
        }
    }

    public static void RegistrarReserva(
        Property property,
        Contacto? contacto,
        bool esReserva,
        decimal? precioCierre,
        Guid currentUserId,
        DateTimeOffset ecuadorNow,
        CrmDbContext context,
        ILogger logger)
    {
        if (esReserva && contacto != null)
        {
            contacto.EstadoEmbudo = "En Negociación";
            logger.LogInformation("🤝 [PROCESSOR] Propiedad {Titulo} Reservada. Contacto {Nombre} pasó a En Negociación.", property.Titulo, contacto.Nombre);

            string reservaTexto = (precioCierre.HasValue && precioCierre.Value > 0)
                ? $"por un monto de reserva de {precioCierre.Value:C}"
                : "de palabra";

            context.Interactions.Add(new Interaction
            {
                AgenteId = currentUserId,
                ContactoId = contacto.Id,
                PropiedadId = property.Id,
                TipoInteraccion = "Reserva",
                Notas = $"Propiedad '{property.Titulo}' marcada como Reservada {reservaTexto}."
            });

            context.PropertyTransactions.Add(new PropertyTransaction
            {
                Id = Guid.NewGuid(),
                PropertyId = property.Id,
                ContactoId = contacto.Id,
                TransactionType = "Reservation",
                TransactionStatus = "Active",
                Amount = precioCierre,
                TransactionDate = ecuadorNow,
                CreatedById = currentUserId,
                Notes = $"Propiedad reservada {reservaTexto}."
            });
        }
    }

    public static void RegistrarCierre(
        Property property,
        Contacto? contacto,
        bool esCierre,
        string nuevoEstado,
        decimal? precioCierre,
        Guid currentUserId,
        DateTimeOffset ecuadorNow,
        CrmDbContext context,
        ILogger logger)
    {
        if (esCierre && contacto != null)
        {
            contacto.EstadoEmbudo = "Cerrado";
            contacto.FechaCierre = ecuadorNow;

            var tipoTransaccion = nuevoEstado == "Alquilada" ? "Rent" : "Sale";

            logger.LogInformation("📄 [PROCESSOR] Creando registro de transacción PropertyTransaction tipo {Tipo}...", tipoTransaccion);
            context.PropertyTransactions.Add(new PropertyTransaction
            {
                Id = Guid.NewGuid(),
                PropertyId = property.Id,
                ContactoId = contacto.Id,
                TransactionType = tipoTransaccion,
                TransactionStatus = "Active",
                Amount = precioCierre ?? property.Precio,
                TransactionDate = ecuadorNow,
                CreatedById = currentUserId,
                Notes = $"Cierre realizado desde el detalle de la propiedad. Marcada como {nuevoEstado}."
            });

            context.Interactions.Add(new Interaction
            {
                AgenteId = currentUserId,
                ContactoId = contacto.Id,
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
