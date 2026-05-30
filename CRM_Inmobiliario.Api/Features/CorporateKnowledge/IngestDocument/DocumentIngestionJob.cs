using System;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using OpenAI.Embeddings;
using Pgvector;

namespace CRM_Inmobiliario.Api.Features.CorporateKnowledge.IngestDocument;

public class DocumentIngestionJob
{
    private readonly CrmDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string? _openAiApiKey;
    private readonly string? _geminiApiKey;

    public DocumentIngestionJob(CrmDbContext context, IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _httpClientFactory = httpClientFactory;
        _openAiApiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY")?.Trim().Trim('"');
        _geminiApiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY")?.Trim().Trim('"');
    }

    public async Task GenerateEmbeddingsAsync(Guid documentId, string? provider, string? apiKey)
    {
        var chunks = await _context.DocumentChunks
            .Where(c => c.DocumentId == documentId && c.Embedding == null && c.GeminiEmbedding == null)
            .OrderBy(c => c.ChunkIndex)
            .ToListAsync();

        if (chunks.Count == 0) return;

        if (provider == "Gemini")
        {
            var key = apiKey ?? _geminiApiKey;
            if (string.IsNullOrEmpty(key)) return;

            using var httpClient = _httpClientFactory.CreateClient("Gemini");
            foreach (var chunk in chunks)
            {
                var req = new { content = new { parts = new[] { new { text = chunk.Content } } } };
                var response = await httpClient.PostAsJsonAsync($"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={key}", req);
                if (response.IsSuccessStatusCode)
                {
                    var doc = await response.Content.ReadFromJsonAsync<System.Text.Json.JsonDocument>();
                    var values = doc?.RootElement.GetProperty("embedding").GetProperty("values").EnumerateArray().Select(x => x.GetSingle()).ToArray();
                    if (values != null)
                    {
                        chunk.GeminiEmbedding = new Vector(values);
                    }
                }
            }
        }
        else
        {
            var key = apiKey ?? _openAiApiKey;
            if (string.IsNullOrEmpty(key)) return;

            var embeddingClient = new EmbeddingClient("text-embedding-3-small", key);
            var stringChunks = chunks.Select(c => c.Content ?? "").ToList();
            var embeddingsResult = await embeddingClient.GenerateEmbeddingsAsync(stringChunks);
            var embeddings = embeddingsResult.Value;

            for (int i = 0; i < chunks.Count; i++)
            {
                chunks[i].Embedding = new Vector(embeddings[i].ToFloats().ToArray());
            }
        }

        await _context.SaveChangesAsync();
    }
}
