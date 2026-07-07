using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Features.Propiedades;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Tests.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace CRM_Inmobiliario.Tests.Features.Propiedades;

public class ListarPropiedadesIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;
    private readonly Guid _agentId = Guid.Parse(TestAuthHandler.DefaultUserId);
    private readonly Guid _otherAgentId = Guid.NewGuid();

    public ListarPropiedadesIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
        SeedTestData();
    }

    private void SeedTestData()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CrmDbContext>();

        if (db.Properties.Any())
        {
            db.Properties.RemoveRange(db.Properties);
            db.AgentArchivedProperties.RemoveRange(db.AgentArchivedProperties);
            db.SaveChanges();
        }

        var agentePrincipal = new Agent { Id = _agentId, Nombre = "Agente", Apellido = "Test", Email = "agente@test.com", Rol = "Agente" };
        var otroAgente = new Agent { Id = _otherAgentId, Nombre = "Otro", Apellido = "Agente", Email = "otro@test.com", Rol = "Agente" };

        if (!db.Agents.Any(a => a.Id == _agentId)) db.Agents.Add(agentePrincipal);
        if (!db.Agents.Any(a => a.Id == _otherAgentId)) db.Agents.Add(otroAgente);

        var propiedades = new List<Property>
        {
            // 0: Casa, Venta, Activo, 150000, 200m, 3 hab, 5 años, Captación Propia (Agente Principal)
            new Property { 
                Id = Guid.NewGuid(), Titulo = "Casa Bonita", TipoPropiedad = "Casa", Operacion = "Venta", EstadoComercial = "Activo",
                Precio = 150000m, AreaTotal = 200m, Habitaciones = 3, AniosAntiguedad = 5, 
                EsCaptacionPropia = true, AgenteId = _agentId, FechaIngreso = DateTimeOffset.UtcNow,
                Version = 1
            },
            
            // 1: Departamento, Alquiler, Suspendido, 800, 80m, 2 hab, 10 años, Captación Propia (Otro Agente)
            new Property { 
                Id = Guid.NewGuid(), Titulo = "Depto Moderno", TipoPropiedad = "Departamento", Operacion = "Alquiler", EstadoComercial = "Suspendido",
                Precio = 800m, AreaTotal = 80m, Habitaciones = 2, AniosAntiguedad = 10, 
                EsCaptacionPropia = true, AgenteId = _otherAgentId, FechaIngreso = DateTimeOffset.UtcNow,
                Version = 1
            },
            
            // 2: Terreno, Venta, Activo, 50000, 500m, 0 hab, 0 años, Archivada
            new Property { 
                Id = Guid.NewGuid(), Titulo = "Terreno Amplio", TipoPropiedad = "Terreno", Operacion = "Venta", EstadoComercial = "Activo",
                Precio = 50000m, AreaTotal = 500m, Habitaciones = 0, AniosAntiguedad = 0, 
                EsCaptacionPropia = false, AgenteId = _agentId, FechaIngreso = DateTimeOffset.UtcNow,
                Version = 1
            },
            
            // 3: Oficina, Alquiler Temporal, Activo, 1200, 100m, 4 hab, 2 años, Captación Propia (Agente Principal)
            new Property { 
                Id = Guid.NewGuid(), Titulo = "Lujosa oficina centro", TipoPropiedad = "Oficina", Operacion = "Alquiler Temporal", EstadoComercial = "Activo",
                Precio = 1200m, AreaTotal = 100m, Habitaciones = 4, AniosAntiguedad = 2, 
                EsCaptacionPropia = true, AgenteId = _agentId, FechaIngreso = DateTimeOffset.UtcNow,
                Version = 1
            }
        };

        foreach(var p in propiedades)
        {
            p.NormalizedSearchText = CrmDbContext.NormalizeText($"{p.Titulo} {p.TipoPropiedad} {p.Operacion} {p.Sector} {p.Ciudad}");
        }

        db.Properties.AddRange(propiedades);
        db.AgentArchivedProperties.Add(new AgentArchivedProperty { AgentId = _agentId, PropiedadId = propiedades[2].Id, ArchivedAt = DateTimeOffset.UtcNow });

        db.SaveChanges();
    }

    private class GetPropiedadesResponse
    {
        public List<Response> Items { get; set; } = new();
        public int TotalCount { get; set; }
    }

    [Fact]
    public async Task GetPropiedades_SinFiltros_RetornaPropiedadesDelAgenteNoArchivadas()
    {
        var response = await _client.GetFromJsonAsync<GetPropiedadesResponse>("/api/propiedades?IsArchived=false");
        
        Assert.NotNull(response);
        // Debe traer a: Casa Bonita (Agente Principal), Lujosa oficina centro (Agente Principal)
        // Depto Moderno es de Otro Agente y no hay transacción compartida
        // Terreno Amplio está archivada
        Assert.Equal(2, response.TotalCount);
        Assert.Contains(response.Items, i => i.Titulo == "Casa Bonita");
        Assert.Contains(response.Items, i => i.Titulo == "Lujosa oficina centro");
    }

    [Fact]
    public async Task GetPropiedades_FiltroSearch_FiltraPorILike()
    {
        var response = await _client.GetFromJsonAsync<GetPropiedadesResponse>("/api/propiedades?SearchQuery=LUJOSA&IsArchived=false");
        
        Assert.NotNull(response);
        Assert.Equal(1, response.TotalCount);
        Assert.Equal("Lujosa oficina centro", response.Items.First().Titulo);
    }

    [Fact]
    public async Task GetPropiedades_FiltroEstadoComercial()
    {
        var response = await _client.GetFromJsonAsync<GetPropiedadesResponse>("/api/propiedades?EstadoComercial=Activo&IsArchived=false");
        
        Assert.NotNull(response);
        Assert.All(response.Items, i => Assert.Equal("Activo", i.EstadoComercial));
    }

    [Fact]
    public async Task GetPropiedades_FiltroTipoPropiedad()
    {
        var response = await _client.GetFromJsonAsync<GetPropiedadesResponse>("/api/propiedades?TipoPropiedad=Oficina&IsArchived=false");
        
        Assert.NotNull(response);
        Assert.Equal(1, response.TotalCount);
        Assert.Equal("Oficina", response.Items.First().TipoPropiedad);
    }

    [Fact]
    public async Task GetPropiedades_FiltroOperacion()
    {
        var response = await _client.GetFromJsonAsync<GetPropiedadesResponse>("/api/propiedades?Operacion=Venta&IsArchived=false");
        
        Assert.NotNull(response);
        Assert.Equal(1, response.TotalCount); // Sólo Casa Bonita, Terreno Amplio está archivado
        Assert.Equal("Venta", response.Items.First().Operacion);
    }

    [Fact]
    public async Task GetPropiedades_FiltroRangoPrecio()
    {
        var response = await _client.GetFromJsonAsync<GetPropiedadesResponse>("/api/propiedades?PrecioMin=1000&PrecioMax=2000&IsArchived=false");
        
        Assert.NotNull(response);
        Assert.Equal(1, response.TotalCount);
        Assert.Equal("Lujosa oficina centro", response.Items.First().Titulo);
    }

    [Fact]
    public async Task GetPropiedades_FiltroRangoAreaTotal()
    {
        var response = await _client.GetFromJsonAsync<GetPropiedadesResponse>("/api/propiedades?AreaTotalMin=150&AreaTotalMax=250&IsArchived=false");
        
        Assert.NotNull(response);
        Assert.Equal(1, response.TotalCount);
        Assert.Equal("Casa Bonita", response.Items.First().Titulo);
    }

    [Fact]
    public async Task GetPropiedades_FiltroRangoHabitaciones()
    {
        var response = await _client.GetFromJsonAsync<GetPropiedadesResponse>("/api/propiedades?HabitacionesMin=4&HabitacionesMax=5&IsArchived=false");
        
        Assert.NotNull(response);
        Assert.Equal(1, response.TotalCount);
        Assert.Equal("Lujosa oficina centro", response.Items.First().Titulo);
    }

    [Fact]
    public async Task GetPropiedades_FiltroRangoAniosAntiguedad()
    {
        var response = await _client.GetFromJsonAsync<GetPropiedadesResponse>("/api/propiedades?AniosAntiguedadMin=4&AniosAntiguedadMax=6&IsArchived=false");
        
        Assert.NotNull(response);
        Assert.Equal(1, response.TotalCount);
        Assert.Equal("Casa Bonita", response.Items.First().Titulo);
    }

    [Fact]
    public async Task GetPropiedades_FiltroEsCaptacionPropia()
    {
        // Add a property to the agent that is not captación propia to test this filter properly
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CrmDbContext>();
        
        db.Properties.Add(new Property { 
            Id = Guid.NewGuid(), Titulo = "Propiedad No Propia", TipoPropiedad = "Casa", Operacion = "Venta", EstadoComercial = "Activo",
            Precio = 100m, AreaTotal = 100m, Habitaciones = 1, AniosAntiguedad = 1, 
            EsCaptacionPropia = false, AgenteId = _agentId, FechaIngreso = DateTimeOffset.UtcNow,
            Version = 1,
            NormalizedSearchText = "PROP"
        });
        db.SaveChanges();

        var response = await _client.GetFromJsonAsync<GetPropiedadesResponse>("/api/propiedades?EsCaptacionPropia=true&IsArchived=false");
        
        Assert.NotNull(response);
        Assert.DoesNotContain(response.Items, i => i.Titulo == "Propiedad No Propia");
        Assert.All(response.Items, i => Assert.True(i.EsCaptacionPropia));
    }

    [Fact]
    public async Task GetPropiedades_FiltroIsArchived()
    {
        var response = await _client.GetFromJsonAsync<GetPropiedadesResponse>("/api/propiedades?IsArchived=true");
        
        Assert.NotNull(response);
        Assert.Equal(1, response.TotalCount);
        Assert.Equal("Terreno Amplio", response.Items.First().Titulo);
    }
}
