using System;
using System.Collections.Generic;
using System.Linq;

namespace CRM_Inmobiliario.Api.Features.IA;

public static class ObtenerAuditoriaGeneralProcessor
{
    public static List<AuditoriaSessionResponse> AgruparEventos(IEnumerable<AuditoriaEventRow> events)
    {
        var groupedByContact = events
            .GroupBy(e => e.ContactoId?.ToString() ?? e.Telefono ?? Guid.NewGuid().ToString());

        var sessions = new List<AuditoriaSessionResponse>();

        foreach (var group in groupedByContact)
        {
            var orderedEvents = group.OrderBy(x => x.Fecha).ToList();
            if (!orderedEvents.Any()) continue;

            long currentSessionId = 1;
            DateTimeOffset prevFecha = orderedEvents.First().Fecha;
            var currentSessionEvents = new List<AuditoriaEventRow>();

            foreach (var ev in orderedEvents)
            {
                if ((ev.Fecha - prevFecha).TotalMinutes > 10)
                {
                    if (currentSessionEvents.Any())
                    {
                        sessions.Add(CreateSessionResponse(group.Key, currentSessionId, currentSessionEvents.ToList()));
                        currentSessionId++;
                        currentSessionEvents.Clear();
                    }
                }
                
                currentSessionEvents.Add(ev);
                prevFecha = ev.Fecha;
            }

            if (currentSessionEvents.Any())
            {
                sessions.Add(CreateSessionResponse(group.Key, currentSessionId, currentSessionEvents.ToList()));
            }
        }

        return sessions.OrderByDescending(s => s.FinSesion).ToList();
    }

    private static AuditoriaSessionResponse CreateSessionResponse(string key, long sessionId, List<AuditoriaEventRow> events)
    {
        var first = events.First();
        return new AuditoriaSessionResponse(
            key,
            sessionId,
            first.ContactoId,
            first.Telefono,
            first.ContactoNombre,
            first.ContactoApellido,
            events.Min(x => x.Fecha),
            events.Max(x => x.Fecha),
            first.Canal ?? first.Source,
            events
        );
    }
}
