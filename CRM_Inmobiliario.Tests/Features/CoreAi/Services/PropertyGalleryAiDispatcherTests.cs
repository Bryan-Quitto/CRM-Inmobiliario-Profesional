using System;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.Facebook.Services;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace CRM_Inmobiliario.Tests.Features.CoreAi.Services;

public class PropertyGalleryAiDispatcherTests
{
    private readonly DbContextOptions<CrmDbContext> _dbContextOptions;
    private readonly Mock<IWhatsAppMessageSender> _mockWhatsAppSender;
    private readonly Mock<IFacebookMessageSender> _mockFacebookSender;

    public PropertyGalleryAiDispatcherTests()
    {
        _dbContextOptions = new DbContextOptionsBuilder<CrmDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _mockWhatsAppSender = new Mock<IWhatsAppMessageSender>();
        _mockFacebookSender = new Mock<IFacebookMessageSender>();
    }

    private async Task SeedDatabaseAsync(params PropertyMedia[] media)
    {
        await using var context = new CrmDbContext(_dbContextOptions);
        context.PropertyMedia.AddRange(media);
        await context.SaveChangesAsync();
    }

    [Fact]
    public async Task DispatchGalleryAsync_WithNoPhotos_ReturnsNotFoundMessage()
    {
        // Arrange
        await using var context = new CrmDbContext(_dbContextOptions);
        var dispatcher = new PropertyGalleryAiDispatcher(context, _mockWhatsAppSender.Object, _mockFacebookSender.Object);

        // Act
        var result = await dispatcher.DispatchGalleryAsync("WhatsApp", Guid.NewGuid(), "Baños", true, 0, "123456789", "token", null, CancellationToken.None);

        // Assert
        Assert.Contains("No se encontraron fotos para la sección 'Baños'", result);
    }

    [Fact]
    public async Task DispatchGalleryAsync_WithOffsetExceedingTotal_ReturnsNoMorePhotosMessage()
    {
        // Arrange
        var propiedadId = Guid.NewGuid();
        var sectionId = Guid.NewGuid();
        var section = new PropertyGallerySection { Id = sectionId, Nombre = "Baños", PropiedadId = propiedadId };
        var media = new PropertyMedia { Id = Guid.NewGuid(), PropiedadId = propiedadId, SectionId = sectionId, Section = section, TipoMultimedia = "image/jpeg", UrlPublica = "http://test.com/1.jpg" };

        await SeedDatabaseAsync(media);

        await using var context = new CrmDbContext(_dbContextOptions);
        var dispatcher = new PropertyGalleryAiDispatcher(context, _mockWhatsAppSender.Object, _mockFacebookSender.Object);

        // Act
        var result = await dispatcher.DispatchGalleryAsync("WhatsApp", propiedadId, "Baños", true, 5, "123456789", "token", null, CancellationToken.None);

        // Assert
        Assert.Contains("No hay más fotos en la sección", result);
        Assert.Contains("superó el total", result);
    }

    [Fact]
    public async Task DispatchGalleryAsync_EnviarTodasFalse_ReturnsSummaryMessageWithoutSending()
    {
        // Arrange
        var propiedadId = Guid.NewGuid();
        var sectionId = Guid.NewGuid();
        var section = new PropertyGallerySection { Id = sectionId, Nombre = "Cocina", PropiedadId = propiedadId };
        var media1 = new PropertyMedia { Id = Guid.NewGuid(), PropiedadId = propiedadId, SectionId = sectionId, Section = section, TipoMultimedia = "image/jpeg", UrlPublica = "url1", Descripcion = "Foto 1" };
        var media2 = new PropertyMedia { Id = Guid.NewGuid(), PropiedadId = propiedadId, SectionId = sectionId, Section = section, TipoMultimedia = "image/jpeg", UrlPublica = "url2", Descripcion = "Foto 2" };

        await SeedDatabaseAsync(media1, media2);

        await using var context = new CrmDbContext(_dbContextOptions);
        var dispatcher = new PropertyGalleryAiDispatcher(context, _mockWhatsAppSender.Object, _mockFacebookSender.Object);

        // Act
        var result = await dispatcher.DispatchGalleryAsync("WhatsApp", propiedadId, "Cocina", false, 0, "123", "token", null, CancellationToken.None);

        // Assert
        Assert.Contains("Se encontraron 2 fotos en 'Cocina'", result);
        Assert.Contains("Foto 1", result);
        Assert.Contains("Foto 2", result);

        _mockWhatsAppSender.Verify(s => s.SendImageMessageAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DispatchGalleryAsync_EnviarTodasTrue_WhatsApp_SendsImagesViaWhatsApp()
    {
        // Arrange
        var propiedadId = Guid.NewGuid();
        var sectionId = Guid.NewGuid();
        var section = new PropertyGallerySection { Id = sectionId, Nombre = "Sala", PropiedadId = propiedadId };
        var media1 = new PropertyMedia { Id = Guid.NewGuid(), PropiedadId = propiedadId, SectionId = sectionId, Section = section, TipoMultimedia = "image/jpeg", UrlPublica = "url1", Descripcion = "Foto 1" };

        await SeedDatabaseAsync(media1);

        await using var context = new CrmDbContext(_dbContextOptions);
        var dispatcher = new PropertyGalleryAiDispatcher(context, _mockWhatsAppSender.Object, _mockFacebookSender.Object);

        // Act
        var result = await dispatcher.DispatchGalleryAsync("WhatsApp", propiedadId, "Sala", true, 0, "123", "token", null, CancellationToken.None);

        // Assert
        Assert.Contains("Se han enviado 1 fotos exitosamente", result);

        _mockWhatsAppSender.Verify(s => s.SendImageMessageAsync("123", "url1", "Foto 1", "token", true, null, It.IsAny<CancellationToken>()), Times.Once);
        _mockFacebookSender.Verify(s => s.SendImageMessageAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<Guid?>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DispatchGalleryAsync_EnviarTodasTrue_Facebook_SendsImagesViaFacebook()
    {
        // Arrange
        var propiedadId = Guid.NewGuid();
        var sectionId = Guid.NewGuid();
        var section = new PropertyGallerySection { Id = sectionId, Nombre = "Comedor", PropiedadId = propiedadId };
        var media1 = new PropertyMedia { Id = Guid.NewGuid(), PropiedadId = propiedadId, SectionId = sectionId, Section = section, TipoMultimedia = "image/png", UrlPublica = "fb-url", Descripcion = "Foto FB" };

        await SeedDatabaseAsync(media1);

        await using var context = new CrmDbContext(_dbContextOptions);
        var dispatcher = new PropertyGalleryAiDispatcher(context, _mockWhatsAppSender.Object, _mockFacebookSender.Object);

        // Act
        var result = await dispatcher.DispatchGalleryAsync("Facebook", propiedadId, "Comedor", true, 0, "fb-psid", "fb-token", null, CancellationToken.None);

        // Assert
        Assert.Contains("Se han enviado 1 fotos exitosamente", result);

        _mockFacebookSender.Verify(s => s.SendImageMessageAsync("fb-psid", "fb-url", "fb-token", true, null, null, It.IsAny<CancellationToken>()), Times.Once);
        _mockWhatsAppSender.Verify(s => s.SendImageMessageAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
