using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Tools;
using CRM_Inmobiliario.Api.Features.CoreAi.Services;

namespace CRM_Inmobiliario.Tests.Features.WhatsApp.Services.Tools
{
    public class RegistrarInteresContactoHandlerTests
    {
        private Mock<IDbContextFactory<CrmDbContext>> _dbContextFactoryMock;
        private DbContextOptions<CrmDbContext> _options;

        public RegistrarInteresContactoHandlerTests()
        {
            _options = new DbContextOptionsBuilder<CrmDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
                
            _dbContextFactoryMock = new Mock<IDbContextFactory<CrmDbContext>>();
            _dbContextFactoryMock.Setup(f => f.CreateDbContextAsync(It.IsAny<System.Threading.CancellationToken>()))
                                 .ReturnsAsync(() => new CrmDbContext(_options));
        }

        [Fact]
        public async Task ExecuteAsync_WithValidPropertyAndContext_CreatesNewInterest()
        {
            // Arrange
            var contactoId = Guid.NewGuid();
            var propiedadId = Guid.NewGuid();
            
            using (var dbContext = new CrmDbContext(_options))
            {
                var contacto = new Contacto { Id = contactoId, Nombre = "Test", Telefono = "123456789" };
                var propiedad = new Property { Id = propiedadId };
                
                dbContext.Contactos.Add(contacto);
                dbContext.Properties.Add(propiedad);
                await dbContext.SaveChangesAsync();
            }

            var loggerMock = new Mock<ILogger<RegistrarInteresContactoHandler>>();
            var handler = new RegistrarInteresContactoHandler(_dbContextFactoryMock.Object, loggerMock.Object);

            var context = new ToolExecutionContext
            {
                ContactoId = contactoId,
                Channel = "Copilot",
                CustomerPhone = "123456789"
            };

            var argsJson = $"{{\"propiedadId\": \"{propiedadId}\", \"nivelInteres\": \"Alto\"}}";
            using var jsonDocument = JsonDocument.Parse(argsJson);

            // Act
            var result = await handler.ExecuteAsync(jsonDocument, context);

            // Assert
            Assert.Contains("Interés registrado correctamente", result);
            
            using (var dbContext = new CrmDbContext(_options))
            {
                var interest = await dbContext.ContactoInteresPropiedades.FirstOrDefaultAsync(i => i.ContactoId == contactoId && i.PropiedadId == propiedadId);
                Assert.NotNull(interest);
                Assert.Equal("Alto", interest.NivelInteres);
            }
        }

        [Fact]
        public async Task ExecuteAsync_WithExistingInterest_UpdatesInterestLevel()
        {
            // Arrange
            var contactoId = Guid.NewGuid();
            var propiedadId = Guid.NewGuid();
            
            using (var dbContext = new CrmDbContext(_options))
            {
                var contacto = new Contacto { Id = contactoId, Nombre = "Test", Telefono = "123456789" };
                var propiedad = new Property { Id = propiedadId };
                var interest = new ContactoInteresPropiedad { ContactoId = contactoId, PropiedadId = propiedadId, NivelInteres = "Bajo", FechaRegistro = DateTimeOffset.UtcNow };
                
                dbContext.Contactos.Add(contacto);
                dbContext.Properties.Add(propiedad);
                dbContext.ContactoInteresPropiedades.Add(interest);
                await dbContext.SaveChangesAsync();
            }

            var loggerMock = new Mock<ILogger<RegistrarInteresContactoHandler>>();
            var handler = new RegistrarInteresContactoHandler(_dbContextFactoryMock.Object, loggerMock.Object);

            var context = new ToolExecutionContext
            {
                ContactoId = contactoId,
                Channel = "Copilot",
                CustomerPhone = "123456789"
            };

            var argsJson = $"{{\"propiedadId\": \"{propiedadId}\", \"nivelInteres\": \"Alto\"}}";
            using var jsonDocument = JsonDocument.Parse(argsJson);

            // Act
            var result = await handler.ExecuteAsync(jsonDocument, context);

            // Assert
            Assert.Contains("Interés registrado correctamente", result);
            
            using (var dbContext = new CrmDbContext(_options))
            {
                var updatedInterest = await dbContext.ContactoInteresPropiedades.FirstOrDefaultAsync(i => i.ContactoId == contactoId && i.PropiedadId == propiedadId);
                Assert.NotNull(updatedInterest);
                Assert.Equal("Alto", updatedInterest.NivelInteres);
            }
        }
        
        [Fact]
        public async Task ExecuteAsync_WithInvalidProperty_ReturnsError()
        {
            // Arrange
            var contactoId = Guid.NewGuid();
            var propiedadId = Guid.NewGuid(); // Not added to DbContext
            
            var loggerMock = new Mock<ILogger<RegistrarInteresContactoHandler>>();
            var handler = new RegistrarInteresContactoHandler(_dbContextFactoryMock.Object, loggerMock.Object);

            var context = new ToolExecutionContext
            {
                ContactoId = contactoId,
                Channel = "Copilot"
            };

            var argsJson = $"{{\"propiedadId\": \"{propiedadId}\", \"nivelInteres\": \"Alto\"}}";
            using var jsonDocument = JsonDocument.Parse(argsJson);

            // Act
            var result = await handler.ExecuteAsync(jsonDocument, context);

            // Assert
            Assert.Contains("Error: La propiedad con ese ID no existe", result);
        }
    }
}
