using System;
using System.Collections.Generic;
using System.Linq;
using Xunit;
using static CRM_Inmobiliario.Api.Features.IA.ObtenerAuditoriaGeneral;

namespace CRM_Inmobiliario.Tests.Features.WhatsApp
{
    public class ObtenerAuditoriaGeneralTests
    {
        [Fact]
        public void AgruparEventos_WithEventsWithin10Minutes_ShouldGroupIntoSameSession()
        {
            // Arrange
            var contactId = Guid.NewGuid();
            var baseTime = new DateTimeOffset(2023, 1, 1, 12, 0, 0, TimeSpan.Zero);
            
            var events = new List<AuditoriaEventRow>
            {
                new AuditoriaEventRow { EventId = Guid.NewGuid(), ContactoId = contactId, Telefono = null, Fecha = baseTime, Accion = "Message", DetalleJson = "Msg1", TriggerMessage = null, Canal = "WhatsApp" },
                new AuditoriaEventRow { EventId = Guid.NewGuid(), ContactoId = contactId, Telefono = null, Fecha = baseTime.AddMinutes(5), Accion = "Message", DetalleJson = "Msg2", TriggerMessage = null, Canal = "WhatsApp" },
                new AuditoriaEventRow { EventId = Guid.NewGuid(), ContactoId = contactId, Telefono = null, Fecha = baseTime.AddMinutes(9), Accion = "Message", DetalleJson = "Msg3", TriggerMessage = null, Canal = "WhatsApp" }
            };

            // Act
            var sessions = AgruparEventos(events);

            // Assert
            Assert.Single(sessions); // Solo 1 sesión
            Assert.Equal(3, sessions.First().Eventos.Count);
            Assert.Equal(1, sessions.First().SessionId);
            Assert.Equal(contactId, sessions.First().ContactoId);
        }

        [Fact]
        public void AgruparEventos_WithEventsMoreThan10MinutesApart_ShouldGroupIntoDifferentSessions()
        {
            // Arrange
            var phone = "123456789";
            var baseTime = new DateTimeOffset(2023, 1, 1, 12, 0, 0, TimeSpan.Zero);
            
            var events = new List<AuditoriaEventRow>
            {
                new AuditoriaEventRow { EventId = Guid.NewGuid(), ContactoId = null, Telefono = phone, Fecha = baseTime, Accion = "Message", DetalleJson = "Msg1", TriggerMessage = null, Canal = "Facebook" },
                // +5 min (Same session 1)
                new AuditoriaEventRow { EventId = Guid.NewGuid(), ContactoId = null, Telefono = phone, Fecha = baseTime.AddMinutes(5), Accion = "Message", DetalleJson = "Msg2", TriggerMessage = null, Canal = "Facebook" },
                // +11 min gap from Msg2 -> (12:05 to 12:16) (New session 2)
                new AuditoriaEventRow { EventId = Guid.NewGuid(), ContactoId = null, Telefono = phone, Fecha = baseTime.AddMinutes(16), Accion = "Message", DetalleJson = "Msg3", TriggerMessage = null, Canal = "Facebook" },
                // +5 min gap from Msg3 -> (12:16 to 12:21) (Same session 2)
                new AuditoriaEventRow { EventId = Guid.NewGuid(), ContactoId = null, Telefono = phone, Fecha = baseTime.AddMinutes(21), Accion = "Message", DetalleJson = "Msg4", TriggerMessage = null, Canal = "Facebook" }
            };

            // Act
            var sessions = AgruparEventos(events);

            // Assert
            Assert.Equal(2, sessions.Count);
            
            // Should be ordered by FinSesion Descending
            var session2 = sessions[0]; // FinSesion: 12:21
            var session1 = sessions[1]; // FinSesion: 12:05

            Assert.Equal(2, session2.SessionId);
            Assert.Equal(2, session2.Eventos.Count);

            Assert.Equal(1, session1.SessionId);
            Assert.Equal(2, session1.Eventos.Count);
        }

        [Fact]
        public void AgruparEventos_WithDifferentContacts_ShouldSeparateSessionsByContact()
        {
            // Arrange
            var contact1 = Guid.NewGuid();
            var contact2 = Guid.NewGuid();
            var baseTime = new DateTimeOffset(2023, 1, 1, 12, 0, 0, TimeSpan.Zero);
            
            var events = new List<AuditoriaEventRow>
            {
                new AuditoriaEventRow { EventId = Guid.NewGuid(), ContactoId = contact1, Telefono = null, Fecha = baseTime, Accion = "Message", DetalleJson = "C1_Msg1", TriggerMessage = null, Canal = "WhatsApp" },
                new AuditoriaEventRow { EventId = Guid.NewGuid(), ContactoId = contact2, Telefono = null, Fecha = baseTime.AddMinutes(1), Accion = "Message", DetalleJson = "C2_Msg1", TriggerMessage = null, Canal = "WhatsApp" },
                new AuditoriaEventRow { EventId = Guid.NewGuid(), ContactoId = contact1, Telefono = null, Fecha = baseTime.AddMinutes(2), Accion = "Message", DetalleJson = "C1_Msg2", TriggerMessage = null, Canal = "WhatsApp" },
            };

            // Act
            var sessions = AgruparEventos(events);

            // Assert
            Assert.Equal(2, sessions.Count); // 1 per contact
            
            var sessionC1 = sessions.Single(s => s.ContactoId == contact1);
            var sessionC2 = sessions.Single(s => s.ContactoId == contact2);

            Assert.Equal(1, sessionC1.SessionId);
            Assert.Equal(2, sessionC1.Eventos.Count);

            Assert.Equal(1, sessionC2.SessionId);
            Assert.Equal(1, sessionC2.Eventos.Count);
        }
    }
}
