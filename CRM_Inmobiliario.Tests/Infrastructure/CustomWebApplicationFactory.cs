using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace CRM_Inmobiliario.Tests.Infrastructure;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remover todas las configuraciones previas de EF Core para evitar conflictos (incluyendo IConfigureOptions)
            var dbContextDescriptors = services.Where(d => 
                (d.ServiceType.FullName != null && d.ServiceType.FullName.Contains("CrmDbContext")) ||
                (d.ServiceType.FullName != null && d.ServiceType.FullName.Contains("DbContextOptions")) ||
                (d.ServiceType.FullName != null && d.ServiceType.FullName.Contains("Npgsql"))
            ).ToList();

            foreach (var descriptor in dbContextDescriptors)
            {
                services.Remove(descriptor);
            }

            var dbName = "InMemoryDbForTesting_" + Guid.NewGuid().ToString();

            // Usar InMemoryDatabase para pruebas ultra rápidas
            services.AddDbContext<CrmDbContext>(options =>
            {
                options.UseInMemoryDatabase(dbName);
            }, ServiceLifetime.Scoped, ServiceLifetime.Singleton);

            services.AddDbContextFactory<CrmDbContext>(options =>
            {
                options.UseInMemoryDatabase(dbName);
            });

            // Reemplazar autenticación
            services.AddAuthentication(TestAuthHandler.AuthenticationScheme)
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
                    TestAuthHandler.AuthenticationScheme, options => { });
        });
    }
}
