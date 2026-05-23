using CRM_Inmobiliario.Api.Domain.Entities;
using OpenAI.Embeddings;
using Pgvector;
using System.Threading.Tasks;
using System;

namespace CRM_Inmobiliario.Api.Features.Propiedades.Services;

public interface IPropertyEmbeddingService
{
    Task<Vector?> GenerateEmbeddingForPropertyAsync(Property property);
    Task<Vector?> GenerateEmbeddingAsync(string text);
}

public sealed class PropertyEmbeddingService : IPropertyEmbeddingService
{
    private readonly string? _openAiApiKey;

    public PropertyEmbeddingService()
    {
        _openAiApiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY")?.Trim().Trim('"');
    }

    public async Task<Vector?> GenerateEmbeddingForPropertyAsync(Property property)
    {
        var textToEmbed = $"[{property.TipoPropiedad}] en [{property.Sector}, {property.Ciudad}]. " +
                          $"Operación: {property.Operacion}. " +
                          $"Precio: ${property.Precio}. " +
                          $"{property.Habitaciones} Habitaciones, {property.Banos} Baños. " +
                          $"Área Total: {property.AreaTotal} m2. " +
                          $"Descripción: {property.Titulo} - {property.Descripcion}";

        return await GenerateEmbeddingAsync(textToEmbed);
    }

    public async Task<Vector?> GenerateEmbeddingAsync(string text)
    {
        if (string.IsNullOrEmpty(_openAiApiKey)) return null;

        var embeddingClient = new EmbeddingClient("text-embedding-3-small", _openAiApiKey);
        var result = await embeddingClient.GenerateEmbeddingAsync(text);

        if (result.Value != null)
        {
            return new Vector(result.Value.ToFloats().ToArray());
        }

        return null;
    }
}
