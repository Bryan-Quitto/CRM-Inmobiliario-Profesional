using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Features.Contactos;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Tests.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using System.Net.Http.Json;
using Xunit;

namespace CRM_Inmobiliario.Tests.Features.Contactos;

public class ListarContactosIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;
    private readonly Guid _agentId = Guid.Parse(TestAuthHandler.DefaultUserId);
    private readonly Guid _otherAgentId = Guid.NewGuid();

    public ListarContactosIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
        SeedTestData();
    }

    private void SeedTestData()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CrmDbContext>();

        // Si ya hay datos, evitar duplicados
        if (db.Contactos.Any())
        {
            db.Contactos.RemoveRange(db.Contactos);
            db.AgentArchivedContacts.RemoveRange(db.AgentArchivedContacts);
            db.SaveChanges();
        }

        var agentePrincipal = new Agent { Id = _agentId, Nombre = "Agente", Apellido = "Test", Email = "agente@test.com", Rol = "Agente" };
        var otroAgente = new Agent { Id = _otherAgentId, Nombre = "Otro", Apellido = "Agente", Email = "otro@test.com", Rol = "Agente" };

        if (!db.Agents.Any(a => a.Id == _agentId)) db.Agents.Add(agentePrincipal);
        if (!db.Agents.Any(a => a.Id == _otherAgentId)) db.Agents.Add(otroAgente);

        var idContactoCompartido = Guid.NewGuid();

        // Crear contactos de prueba variados
        var contactos = new List<Contacto>
        {
            // 0: Propietario, IA Activa
            new Contacto { Id = Guid.NewGuid(), Nombre = "Juan", Apellido="Propietario", Email="juan@test.com", AgenteId = _agentId, EsPropietario = true, EsCliente = false, BotActivoWA = true, EstadoIA_WA = null, FechaCreacion = DateTimeOffset.UtcNow },
            
            // 1: Cliente, IA Desactivada (null)
            new Contacto { Id = Guid.NewGuid(), Nombre = "Maria", Apellido="Cliente", Email="maria@test.com", AgenteId = _agentId, EsPropietario = false, EsCliente = true, BotActivoWA = false, EstadoIA_WA = null, FechaCreacion = DateTimeOffset.UtcNow },
            
            // 2: Cliente, IA Escalado
            new Contacto { Id = Guid.NewGuid(), Nombre = "Pedro", Apellido="Escalado", Email="pedro@test.com", AgenteId = _agentId, EsPropietario = false, EsCliente = true, BotActivoWA = true, EstadoIA_WA = "Escalado", FechaCreacion = DateTimeOffset.UtcNow },
            
            // 3: Propietario, Compartido
            new Contacto { 
                Id = idContactoCompartido, 
                Nombre = "Luis", 
                Apellido="Compartido", 
                Email="luis@test.com", 
                AgenteId = _otherAgentId, 
                EsPropietario = true, 
                EsCliente = false, 
                FechaCreacion = DateTimeOffset.UtcNow, 
                CompartidoCon = new List<ContactoAgenteCompartido> { 
                    new ContactoAgenteCompartido { AgenteId = _agentId, ContactoId = idContactoCompartido, FechaCompartido = DateTimeOffset.UtcNow } 
                } 
            },
            
            // 4: Cliente, Archivado
            new Contacto { Id = Guid.NewGuid(), Nombre = "Ana", Apellido="Archivada", Email="ana@test.com", AgenteId = _agentId, EsPropietario = false, EsCliente = true, FechaCreacion = DateTimeOffset.UtcNow },
            
            // 5: Ajeno (No debe salir)
            new Contacto { Id = Guid.NewGuid(), Nombre = "Carlos", Apellido="Ajeno", Email="carlos@test.com", AgenteId = _otherAgentId, EsPropietario = true, EsCliente = false, FechaCreacion = DateTimeOffset.UtcNow }
        };

        // Normalizar textos (búsqueda)
        foreach(var c in contactos)
        {
            c.NormalizedSearchText = CrmDbContext.NormalizeText($"{c.Nombre} {c.Apellido} {c.Email} {c.Telefono}");
        }

        db.Contactos.AddRange(contactos);

        // Archivar el contacto Ana
        db.AgentArchivedContacts.Add(new AgentArchivedContact { AgentId = _agentId, ContactoId = contactos[4].Id, ArchivedAt = DateTimeOffset.UtcNow });

        db.SaveChanges();
    }

    [Fact]
    public async Task GetContactos_SinFiltros_RetornaPropiosYCompartidosNoArchivados()
    {
        var response = await _client.GetFromJsonAsync<ListarContactosFeature.GetContactosResponse>("/api/contactos?IsArchived=false");
        
        Assert.NotNull(response);
        // Debe traer a: Juan, Maria, Pedro, Luis (Compartido)
        Assert.Equal(4, response.TotalCount);
        Assert.Equal(4, response.Items.Count);
    }

    [Fact]
    public async Task GetContactos_FiltroSegmentoPropietarios_RetornaSoloPropietarios()
    {
        var response = await _client.GetFromJsonAsync<ListarContactosFeature.GetContactosResponse>("/api/contactos?Segmento=Propietarios&IsArchived=false");
        
        Assert.NotNull(response);
        // Debe traer a: Juan, Luis
        Assert.Equal(2, response.TotalCount);
        Assert.All(response.Items, i => Assert.True(i.EsPropietario));
    }

    [Fact]
    public async Task GetContactos_FiltroIsArchived_RetornaSoloArchivados()
    {
        var response = await _client.GetFromJsonAsync<ListarContactosFeature.GetContactosResponse>("/api/contactos?IsArchived=true");
        
        Assert.NotNull(response);
        // Debe traer a: Ana
        Assert.Equal(1, response.TotalCount);
        Assert.Contains(response.Items, i => i.Nombre.Contains("Ana"));
    }

    [Fact]
    public async Task GetContactos_FiltroSearch_FiltraPorNombreOEmailIgnorandoCase()
    {
        var response = await _client.GetFromJsonAsync<ListarContactosFeature.GetContactosResponse>("/api/contactos?Search=jUaN&IsArchived=false");
        
        Assert.NotNull(response);
        // Debe traer a: Juan
        Assert.Equal(1, response.TotalCount);
        Assert.Equal("Juan", response.Items.First().Nombre);
    }

    [Fact]
    public async Task GetContactos_FiltroEstadoIA_WA_Escalado_FiltraCorrectamente()
    {
        var response = await _client.GetFromJsonAsync<ListarContactosFeature.GetContactosResponse>("/api/contactos?EstadoIA_WA=Escalado&IsArchived=false");
        
        Assert.NotNull(response);
        // Debe traer a: Pedro
        Assert.Equal(1, response.TotalCount);
        Assert.Equal("Pedro", response.Items.First().Nombre);
    }

    [Fact]
    public async Task GetContactos_VisibilidadCompartidos_RetornaContactosDeOtrosAgentes()
    {
        var response = await _client.GetFromJsonAsync<ListarContactosFeature.GetContactosResponse>("/api/contactos?Visibilidad=Compartidos&IsArchived=false");
        
        Assert.NotNull(response);
        // Debe traer a: Luis (el compartido)
        Assert.Equal(1, response.TotalCount);
        Assert.True(response.Items.First().EsCompartido);
    }
}
