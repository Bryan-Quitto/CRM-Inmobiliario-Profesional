using System.IO;
using System.Text.RegularExpressions;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using OpenAI.Embeddings;
using Pgvector;
using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Enums;
using CRM_Inmobiliario.Api.Extensions;

namespace CRM_Inmobiliario.Api.Features.CorporateKnowledge.IngestDocument;

public static class IngestDocumentEndpoint
{
    public static void MapIngestDocumentEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/corporate-knowledge/ingest", async (
            IFormFile file, 
            [Microsoft.AspNetCore.Mvc.FromForm] string audience,
            ClaimsPrincipal user, 
            CrmDbContext context, 
            CancellationToken ct) =>
        {
            if (file == null || file.Length == 0)
                return Results.BadRequest(new { error = "No file provided." });

            if (Path.GetExtension(file.FileName).ToLowerInvariant() != ".md")
                return Results.BadRequest(new { error = "Solo se permiten archivos Markdown (.md)." });

            string content;
            using (var reader = new StreamReader(file.OpenReadStream()))
            {
                content = await reader.ReadToEndAsync(ct);
            }

            // Semantic Chunking: world-class Markdown semantic chunker
            var chunker = new MarkdownSemanticChunker(maxTokens: 500, overlapTokens: 50);
            var chunks = chunker.Chunk(content);

            var openAiApiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY")?.Trim().Trim('"');

            if (!Enum.TryParse<DocumentAudience>(audience, true, out var parsedAudience))
            {
                parsedAudience = DocumentAudience.Public;
            }

            var agenteId = user.GetRequiredUserId();
            var agente = await context.Agents.AsNoTracking().FirstOrDefaultAsync(a => a.Id == agenteId, ct);
            var provider = agente?.ActiveLLMProvider ?? "OpenAI";
            var apiKey = agente?.AiApiKey;

            var document = new Document
            {
                Id = Guid.NewGuid(),
                Title = Path.GetFileNameWithoutExtension(file.FileName),
                Source = file.FileName,
                Audience = parsedAudience,
                CreatedAt = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5))
            };

            var documentChunks = new List<DocumentChunk>();

            if (provider == "Gemini")
            {
                var key = apiKey ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY")?.Trim().Trim('"');
                if (string.IsNullOrEmpty(key)) return Results.Problem("GEMINI_API_KEY no está configurada.");
                
                using var httpClient = new System.Net.Http.HttpClient();
                for (int i = 0; i < chunks.Count; i++)
                {
                    var req = new { content = new { parts = new[] { new { text = chunks[i] } } } };
                    var response = await httpClient.PostAsJsonAsync($"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={key}", req, ct);
                    if (response.IsSuccessStatusCode)
                    {
                        var doc = await response.Content.ReadFromJsonAsync<System.Text.Json.JsonDocument>(cancellationToken: ct);
                        var values = doc?.RootElement.GetProperty("embedding").GetProperty("values").EnumerateArray().Select(x => x.GetSingle()).ToArray();
                        if (values != null)
                        {
                            documentChunks.Add(new DocumentChunk
                            {
                                Id = Guid.NewGuid(),
                                DocumentId = document.Id,
                                Content = chunks[i],
                                GeminiEmbedding = new Vector(values),
                                ChunkIndex = i,
                                Audience = parsedAudience,
                                CreatedAt = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)),
                                Document = document
                            });
                        }
                    }
                }
            }
            else
            {
                var key = apiKey ?? openAiApiKey;
                if (string.IsNullOrEmpty(key)) return Results.Problem("OPENAI_API_KEY no está configurada.");

                var embeddingClient = new EmbeddingClient("text-embedding-3-small", key);
                var embeddingsResult = await embeddingClient.GenerateEmbeddingsAsync(chunks, cancellationToken: ct);
                var embeddings = embeddingsResult.Value;

                for (int i = 0; i < chunks.Count; i++)
                {
                    var vector = new Vector(embeddings[i].ToFloats().ToArray());
                    documentChunks.Add(new DocumentChunk
                    {
                        Id = Guid.NewGuid(),
                        DocumentId = document.Id,
                        Content = chunks[i],
                        Embedding = vector,
                        ChunkIndex = i,
                        Audience = parsedAudience,
                        CreatedAt = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)),
                        Document = document
                    });
                }
            }

            // The One Trip Pattern
            context.Documents.Add(document);
            context.DocumentChunks.AddRange(documentChunks);

            await context.SaveChangesAsync(ct);

            return Results.Ok(new 
            { 
                documentId = document.Id, 
                chunksCreated = documentChunks.Count 
            });
        })
        .RequireAuthorization("AdminPolicy") // Require admin or just authenticated? Let's say AdminPolicy or authenticated.
        .DisableAntiforgery(); // For IFormFile via API
    }
}
