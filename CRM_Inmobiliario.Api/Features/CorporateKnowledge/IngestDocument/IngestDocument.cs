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
using Hangfire;

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
            Hangfire.IBackgroundJobClient backgroundJobs,
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

            var openAiApiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY")?.Trim().Trim('"');

            if (!Enum.TryParse<DocumentAudience>(audience, true, out var parsedAudience))
            {
                parsedAudience = DocumentAudience.Public;
            }

            var agenteId = user.GetRequiredUserId();
            var agente = await context.Agents.AsNoTracking().FirstOrDefaultAsync(a => a.Id == agenteId, ct);
            var provider = agente?.ActiveLLMProvider;
            var apiKey = agente?.AiApiKey;

            // Semantic Chunking: world-class Markdown semantic chunker
            var chunker = new MarkdownSemanticChunker(maxTokens: 500, overlapTokens: 50, provider: provider ?? "OpenAI");
            var chunks = chunker.Chunk(content);

            var document = new Document
            {
                Id = Guid.NewGuid(),
                Title = Path.GetFileNameWithoutExtension(file.FileName),
                Source = file.FileName,
                Audience = parsedAudience,
                CreatedAt = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5))
            };

            var documentChunks = new List<DocumentChunk>();

            for (int i = 0; i < chunks.Count; i++)
            {
                documentChunks.Add(new DocumentChunk
                {
                    Id = Guid.NewGuid(),
                    DocumentId = document.Id,
                    Content = chunks[i],
                    ChunkIndex = i,
                    Audience = parsedAudience,
                    CreatedAt = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)),
                    Document = document
                });
            }

            // The One Trip Pattern
            context.Documents.Add(document);
            context.DocumentChunks.AddRange(documentChunks);

            await context.SaveChangesAsync(ct);

            backgroundJobs.Enqueue<DocumentIngestionJob>(j => j.GenerateEmbeddingsAsync(document.Id, provider, apiKey));

            return Results.Accepted(value: new 
            { 
                documentId = document.Id, 
                chunksCreated = documentChunks.Count,
                status = "Processing embeddings in background"
            });
        })
        .RequireAuthorization("AdminPolicy") // Require admin or just authenticated? Let's say AdminPolicy or authenticated.
        .DisableAntiforgery(); // For IFormFile via API
    }
}
