using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;
using Google.GenAI;
using Google.GenAI.Types;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Providers;

public class GeminiProvider : ILLMProvider
{
    private readonly System.Net.Http.IHttpClientFactory _httpClientFactory;
    private readonly string _modelName;
    private readonly string _apiKey;

    public GeminiProvider(System.Net.Http.IHttpClientFactory httpClientFactory, Microsoft.Extensions.Options.IOptions<CRM_Inmobiliario.Api.Features.Shared.Settings.LLMSettings> settings, string apiKey, string? modelId = null)
    {
        _httpClientFactory = httpClientFactory;
        _modelName = modelId ?? settings.Value.Gemini.DefaultChatModel ?? "gemini-2.5-flash";
        _apiKey = apiKey;
    }

    public async IAsyncEnumerable<AiResponseUpdate> StreamChatAsync(List<AiMessage> history, List<AiToolDefinition> tools, string? cachedContentId = null, int? maxTokens = null, [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var httpClient = _httpClientFactory.CreateClient("LLMProviders");
        var client = new Client(apiKey: _apiKey, clientOptions: new Google.GenAI.Types.ClientOptions { HttpClientFactory = () => httpClient });
        // We will not use ChatSession, we just use GenerateContentStreamAsync directly

        var config = new GenerateContentConfig();
        var contents = new List<Content>();

        foreach (var msg in history)
        {
            if (msg.Role == "system")
            {
                if (string.IsNullOrEmpty(cachedContentId))
                {
                    config.SystemInstruction = new Content { Role = "system", Parts = new List<Part> { new Part { Text = msg.Content } } };
                }
                continue;
            }

            string targetRole = msg.Role == "assistant" ? "model" : "user";
            var parts = new List<Part>();

            if (msg.Role == "user")
            {
                if (msg.Parts != null && msg.Parts.Count > 0)
                {
                    foreach (var p in msg.Parts)
                    {
                        if (p.Type == "text") parts.Add(new Part { Text = p.Text });
                        else if (p.Type == "audio" && p.InlineData != null) parts.Add(new Part { InlineData = new Blob { MimeType = p.MimeType ?? "audio/ogg", Data = p.InlineData } });
                        else if (p.Type == "audio" && p.InlineData == null) parts.Add(new Part { Text = p.Text ?? $"[Audio Note: {p.MediaUrl}]" });
                    }
                }
                else
                {
                    parts.Add(new Part { Text = msg.Content });
                }
            }
            else if (msg.Role == "assistant")
            {
                if (msg.ToolCalls != null && msg.ToolCalls.Count > 0)
                {
                    foreach (var tc in msg.ToolCalls)
                    {
                        using var doc = JsonDocument.Parse(tc.Arguments);
                        var args = new Dictionary<string, object>();
                        foreach (var prop in doc.RootElement.EnumerateObject())
                        {
                            if (prop.Value.ValueKind == JsonValueKind.String) args[prop.Name] = prop.Value.GetString() ?? "";
                            else if (prop.Value.ValueKind == JsonValueKind.Number) args[prop.Name] = prop.Value.GetDouble();
                            else if (prop.Value.ValueKind == JsonValueKind.True) args[prop.Name] = true;
                            else if (prop.Value.ValueKind == JsonValueKind.False) args[prop.Name] = false;
                        }
                        parts.Add(new Part { FunctionCall = new FunctionCall { Name = tc.Name, Args = args } });
                    }
                }
                else
                {
                    parts.Add(new Part { Text = msg.Content });
                }
            }
            else if (msg.Role == "tool")
            {
                var dict = new Dictionary<string, object>();
                try
                {
                    using var doc = JsonDocument.Parse(msg.Content);
                    if (doc.RootElement.ValueKind == JsonValueKind.Object)
                    {
                        foreach (var prop in doc.RootElement.EnumerateObject())
                        {
                            if (prop.Value.ValueKind == JsonValueKind.String) dict[prop.Name] = prop.Value.GetString() ?? "";
                            else dict[prop.Name] = prop.Value.GetRawText();
                        }
                    }
                    else dict["result"] = msg.Content;
                }
                catch { dict["result"] = msg.Content; }
                parts.Add(new Part { FunctionResponse = new FunctionResponse { Name = msg.ToolCallId ?? "unknown", Response = dict } });
            }

            if (contents.Count > 0 && contents[contents.Count - 1].Role == targetRole)
            {
                if (contents[contents.Count - 1].Parts == null) contents[contents.Count - 1].Parts = new List<Part>();
                ((List<Part>)contents[contents.Count - 1].Parts!).AddRange(parts);
            }
            else
            {
                contents.Add(new Content { Role = targetRole, Parts = parts });
            }
        }

        var toolsList = new List<Tool>();
        var functionDeclarations = new List<FunctionDeclaration>();

        foreach (var t in tools)
        {
            var fd = new FunctionDeclaration
            {
                Name = t.Name,
                Description = t.Description,
                Parameters = GeminiSchemaMapper.ParseSchema(t.ParametersSchema)
            };
            functionDeclarations.Add(fd);
        }

        if (functionDeclarations.Count > 0)
        {
            toolsList.Add(new Tool { FunctionDeclarations = functionDeclarations });
        }

        bool hasAudio = history.LastOrDefault()?.Parts?.Any(p => p.Type == "audio" && p.InlineData != null) == true;

        if (!string.IsNullOrEmpty(cachedContentId))
        {
            config.CachedContent = cachedContentId;
        }
        
        if (contents.Count > 0 && contents[0].Role == "system")
        {
            if (string.IsNullOrEmpty(cachedContentId))
            {
                config.SystemInstruction = new Content { Role = "system", Parts = contents[0].Parts };
            }
            contents.RemoveAt(0);
        }

        if (string.IsNullOrEmpty(cachedContentId) && toolsList.Count > 0)
        {
            config.Tools = toolsList;
        }

        if (hasAudio)
        {
            config.ResponseMimeType = "application/json";
            config.ResponseSchema = new Google.GenAI.Types.Schema 
            { 
                Type = Google.GenAI.Types.Type.Object,
                Properties = new Dictionary<string, Google.GenAI.Types.Schema>
                {
                    { "user_transcription", new Google.GenAI.Types.Schema { Type = Google.GenAI.Types.Type.String } },
                    { "ai_reply", new Google.GenAI.Types.Schema { Type = Google.GenAI.Types.Type.String } }
                },
                Required = new List<string> { "user_transcription", "ai_reply" }
            };
            
            var lastUserContent = contents.LastOrDefault(c => c.Role == "user");
            if (lastUserContent != null && lastUserContent.Parts != null)
            {
                lastUserContent.Parts.Add(new Part { Text = "\n\nCRITICAL: The last message contains an audio note. You MUST respond in valid JSON matching the schema, providing the literal transcription in 'user_transcription' and your reply to the user in 'ai_reply'. Do NOT use any tools this turn." });
            }
        }

        if (maxTokens.HasValue)
        {
            config.MaxOutputTokens = maxTokens;
        }

        Console.WriteLine("\n[GEMINI_DEBUG_PAYLOAD] --- START STREAM REQUEST ---");
        try { Console.WriteLine(JsonSerializer.Serialize(contents, new JsonSerializerOptions { WriteIndented = true })); } catch { }
        Console.WriteLine("[GEMINI_DEBUG_PAYLOAD] --- END STREAM REQUEST ---\n");

        var responseStream = client.Models.GenerateContentStreamAsync(_modelName, contents, config, cancellationToken: cancellationToken);
        
        if (hasAudio)
        {
            var fullJson = new System.Text.StringBuilder();
            Google.GenAI.Types.GenerateContentResponseUsageMetadata? finalUsage = null;
            await foreach (var response in responseStream.ConfigureAwait(false))
            {
                if (response.Text != null) fullJson.Append(response.Text);
                if (response.UsageMetadata != null) finalUsage = response.UsageMetadata;
            }
            
            AiResponseUpdate? finalUpdate = null;
            try
            {
                using var doc = JsonDocument.Parse(fullJson.ToString());
                var aiReply = doc.RootElement.GetProperty("ai_reply").GetString() ?? "";
                var transcription = doc.RootElement.GetProperty("user_transcription").GetString() ?? "";
                
                finalUpdate = new AiResponseUpdate 
                { 
                    TextUpdate = aiReply, 
                    FinishReason = "stop",
                    AudioTranscription = transcription
                };
            }
            catch
            {
                finalUpdate = new AiResponseUpdate { TextUpdate = fullJson.ToString(), FinishReason = "stop" };
            }
            
            if (finalUpdate != null)
            {
                if (finalUsage != null)
                {
                    finalUpdate.TotalTokens = finalUsage.TotalTokenCount ?? 0;
                    finalUpdate.InputTokens = finalUsage.PromptTokenCount ?? 0;
                    finalUpdate.CachedTokens = finalUsage.CachedContentTokenCount ?? 0;
                    finalUpdate.OutputTokens = finalUsage.CandidatesTokenCount ?? 0;
                }
                yield return finalUpdate;
            }
            yield break;
        }
        
        await foreach (var response in responseStream.ConfigureAwait(false))
        {
            var update = new AiResponseUpdate();
            
            Console.WriteLine($"[GEMINI_DEBUG] Raw chunk received. Text: '{response.Text}'");
            if (response.Candidates != null && response.Candidates.Count > 0)
            {
                var candidate = response.Candidates[0];
                Console.WriteLine($"[GEMINI_DEBUG] FinishReason: {candidate.FinishReason}");
                if (candidate.Content?.Parts != null)
                {
                    foreach (var part in candidate.Content.Parts)
                    {
                        if (part.FunctionCall != null)
                        {
                            Console.WriteLine($"[GEMINI_DEBUG] Parsed FunctionCall from Part: {part.FunctionCall.Name}");
                            update.ToolCallUpdate = new AiToolCall
                            {
                                Id = part.FunctionCall.Name ?? "",
                                Name = part.FunctionCall.Name ?? "",
                                Arguments = JsonSerializer.Serialize(part.FunctionCall.Args)
                            };
                            update.FinishReason = "tool_calls";
                        }
                    }
                }
            }

            if (response.Text != null)
            {
                update.TextUpdate = response.Text;
            }

            if (update.ToolCallUpdate == null)
            {
                update.FinishReason = "stop";
            }
            
            if (response.UsageMetadata != null)
            {
                Console.WriteLine($"[GEMINI_DEBUG] Usage: Output={response.UsageMetadata.CandidatesTokenCount}, Input={response.UsageMetadata.PromptTokenCount}");
                update.TotalTokens = response.UsageMetadata.TotalTokenCount ?? 0;
                update.InputTokens = response.UsageMetadata.PromptTokenCount ?? 0;
                update.CachedTokens = response.UsageMetadata.CachedContentTokenCount ?? 0;
                update.OutputTokens = response.UsageMetadata.CandidatesTokenCount ?? 0;
            }
            
            yield return update;
        }
    }


    public async Task<T?> GetStructuredResponseAsync<T>(List<AiMessage> history, CancellationToken cancellationToken)
    {
        var httpClient = _httpClientFactory.CreateClient("LLMProviders");
        var client = new Client(apiKey: _apiKey, clientOptions: new Google.GenAI.Types.ClientOptions { HttpClientFactory = () => httpClient });
        var config = new GenerateContentConfig();
        var contents = new List<Content>();

        foreach (var msg in history)
        {
            if (msg.Role == "system")
            {
                config.SystemInstruction = new Content { Role = "system", Parts = new List<Part> { new Part { Text = msg.Content } } };
                continue;
            }
            string targetRole = msg.Role == "assistant" ? "model" : "user";
            contents.Add(new Content { Role = targetRole, Parts = new List<Part> { new Part { Text = msg.Content } } });
        }

        var options = new JsonSerializerOptions
        {
            Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() },
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            TypeInfoResolver = new System.Text.Json.Serialization.Metadata.DefaultJsonTypeInfoResolver()
        };

        var schemaNode = System.Text.Json.Schema.JsonSchemaExporter.GetJsonSchemaAsNode(options, typeof(T));
        var geminiSchema = GeminiSchemaMapper.ParseSchema(schemaNode.ToJsonString());

        config.ResponseMimeType = "application/json";
        config.ResponseSchema = geminiSchema;

        Console.WriteLine("\n[GEMINI_DEBUG_PAYLOAD] --- START STRUCTURED REQUEST ---");
        try { Console.WriteLine(JsonSerializer.Serialize(contents, new JsonSerializerOptions { WriteIndented = true })); } catch { }
        Console.WriteLine("[GEMINI_DEBUG_PAYLOAD] --- END STRUCTURED REQUEST ---\n");

        var response = await client.Models.GenerateContentAsync(_modelName, contents, config);
        var content = response.Text;
        if (string.IsNullOrEmpty(content)) return default;
        return JsonSerializer.Deserialize<T>(content, options);
    }
}
