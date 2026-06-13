using System;
using System.Linq;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Features.PushNotifications.Services;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CRM_Inmobiliario.Tests.Features.PushNotifications.Services;

public class PushNotificationServiceTests
{
    private readonly DbContextOptions<CrmDbContext> _dbContextOptions;

    public PushNotificationServiceTests()
    {
        _dbContextOptions = new DbContextOptionsBuilder<CrmDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
    }

    [Fact]
    public async Task SubscribeAgentAsync_SavesSubscriptionToDatabase()
    {
        // Arrange
        var agentId = Guid.NewGuid();
        var endpoint = "https://fcm.googleapis.com/fcm/send/test";
        var p256dh = "p256dh_key";
        var auth = "auth_key";
        var userAgent = "Mozilla/5.0";

        var mockConfig = new Mock<IConfiguration>();
        var mockLogger = new Mock<ILogger<PushNotificationService>>();

        await using var context = new CrmDbContext(_dbContextOptions);
        var service = new PushNotificationService(context, mockConfig.Object, mockLogger.Object);

        // Act
        await service.SubscribeAgentAsync(agentId, endpoint, p256dh, auth, userAgent);

        // Assert
        var subscription = await context.AgentPushSubscriptions.FirstOrDefaultAsync(s => s.Endpoint == endpoint);
        Assert.NotNull(subscription);
        Assert.Equal(agentId, subscription.AgentId);
        Assert.Equal(p256dh, subscription.P256dh);
        Assert.Equal(auth, subscription.Auth);
        Assert.Equal(userAgent, subscription.UserAgent);
    }
}
