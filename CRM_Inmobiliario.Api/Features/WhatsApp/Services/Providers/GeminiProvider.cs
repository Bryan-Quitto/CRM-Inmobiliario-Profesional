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

    public GeminiProvider(System.Net.Http.IHttpClientFactory httpClientFactory, Microsoft.Extensions.Options.IOptions<CRM_Inmobiliario.Api.Features.Shared.Settings.LLMSettings> settings)
    {
        _httpClientFactory = httpClientFactory;
        _modelName = settings.Value.Gemini.DefaultChatModel ?? "gemini-3-pro-preview";
    }

    public async IAsyncEnumerable<AiResponseUpdate> StreamChatAsync(List<AiMessage> history, List<AiToolDefinition> tools, string apiKey, string? cachedContentId = null)
    {
        var client = new Client(apiKey: apiKey);
        // We will not use ChatSession, we just use GenerateContentStreamAsync directly

        var contents = new List<Content>();
        foreach (var msg in history)
        {
            if (msg.Role == "system")
            {
                if (string.IsNullOrEmpty(cachedContentId))
                {
                    contents.Add(new Content { Role = "user", Parts = new List<Part> { new Part { Text = "SYSTEM: " + msg.Content } } });
                    contents.Add(new Content { Role = "model", Parts = new List<Part> { new Part { Text = "Understood." } } });
                }
            }
            else if (msg.Role == "user")
            {
                var parts = new List<Part>();
                if (msg.Parts != null && msg.Parts.Count > 0)
                {
                    foreach (var p in msg.Parts)
                    {
                        if (p.Type == "text")
                        {
                            parts.Add(new Part { Text = p.Text });
                        }
                        else if (p.Type == "audio" && p.InlineData != null)
                        {
                            parts.Add(new Part { InlineData = new Blob { MimeType = p.MimeType ?? "audio/ogg", Data = p.InlineData } });
                        }
                        else if (p.Type == "audio" && p.InlineData == null)
                        {
                            parts.Add(new Part { Text = p.Text ?? $"[Audio Note: {p.MediaUrl}]" });
                        }
                    }
                }
                else
                {
                    parts.Add(new Part { Text = msg.Content });
                }
                contents.Add(new Content { Role = "user", Parts = parts });
            }
            else if (msg.Role == "assistant")
            {
                if (msg.ToolCalls != null && msg.ToolCalls.Count > 0)
                {
                    var parts = new List<Part>();
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
                    contents.Add(new Content { Role = "model", Parts = parts });
                }
                else
                {
                    contents.Add(new Content { Role = "model", Parts = new List<Part> { new Part { Text = msg.Content } } });
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
                    else
                    {
                        dict["result"] = msg.Content;
                    }
                }
                catch
                {
                    dict["result"] = msg.Content;
                }
                contents.Add(new Content { Role = "user", Parts = new List<Part> { new Part { FunctionResponse = new FunctionResponse { Name = msg.ToolCallId ?? "unknown", Response = dict } } } });
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

        var config = new GenerateContentConfig();
        
        if (!string.IsNullOrEmpty(cachedContentId))
        {
            config.CachedContent = cachedContentId;
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
            
            if (contents.Count > 0 && contents[0].Role == "user")
            {
                var firstUserParts = contents[0].Parts;
                if (firstUserParts != null && firstUserParts.Count > 0)
                {
                    var firstPart = firstUserParts[0];
                    if (firstPart != null)
                    {
                        var firstPartText = firstPart.Text ?? "";
                        if (firstPartText.StartsWith("SYSTEM: "))
                        {
                            firstPart.Text = firstPartText + "\n\nCRITICAL: The last message contains an audio note. You MUST respond in valid JSON matching the schema, providing the literal transcription in 'user_transcription' and your reply to the user in 'ai_reply'. Do NOT use any tools this turn.";
                        }
                    }
                }
            }
        }
        else if (toolsList.Count > 0)
        {
            config.Tools = toolsList;
        }

        var responseStream = client.Models.GenerateContentStreamAsync(_modelName, contents, config);
        
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
            
            if (response.Text != null)
            {
                update.TextUpdate = response.Text;
            }

            if (response.FunctionCalls != null && response.FunctionCalls.Count > 0)
            {
                var fc = response.FunctionCalls[0];
                update.ToolCallUpdate = new AiToolCall
                {
                    Id = fc.Name ?? "",
                    Name = fc.Name ?? "",
                    Arguments = JsonSerializer.Serialize(fc.Args)
                };
                update.FinishReason = "tool_calls";
            }
            else
            {
                update.FinishReason = "stop";
            }
            
            if (response.UsageMetadata != null)
            {
                update.TotalTokens = response.UsageMetadata.TotalTokenCount ?? 0;
                update.InputTokens = response.UsageMetadata.PromptTokenCount ?? 0;
                update.CachedTokens = response.UsageMetadata.CachedContentTokenCount ?? 0;
                update.OutputTokens = response.UsageMetadata.CandidatesTokenCount ?? 0;
            }
            
            yield return update;
        }
    }


}
