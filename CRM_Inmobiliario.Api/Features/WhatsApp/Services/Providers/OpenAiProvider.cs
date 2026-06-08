using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;
using OpenAI.Chat;
using OpenAI;
using System.ClientModel.Primitives;

using Microsoft.Extensions.Options;
using CRM_Inmobiliario.Api.Features.Shared.Settings;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Providers;

public class OpenAiProvider : ILLMProvider
{
    private readonly System.Net.Http.IHttpClientFactory _httpClientFactory;
    private readonly LLMSettings _settings;
    private readonly string _apiKey;

    public OpenAiProvider(System.Net.Http.IHttpClientFactory httpClientFactory, IOptions<LLMSettings> options, string apiKey)
    {
        _httpClientFactory = httpClientFactory;
        _settings = options.Value;
        _apiKey = apiKey;
    }

    public async IAsyncEnumerable<AiResponseUpdate> StreamChatAsync(List<AiMessage> history, List<AiToolDefinition> tools, string? cachedContentId = null, int? maxTokens = null, [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var httpClient = _httpClientFactory.CreateClient("OpenAI");
        var clientOptions = new OpenAIClientOptions
        {
            Transport = new HttpClientPipelineTransport(httpClient)
        };
        
        var chatClient = new ChatClient(_settings.OpenAI.DefaultChatModel, new System.ClientModel.ApiKeyCredential(_apiKey), clientOptions);

        var chatMessages = new List<ChatMessage>();
        foreach (var msg in history)
        {
            if (msg.Role == "system") chatMessages.Add(new SystemChatMessage(msg.Content));
            else if (msg.Role == "user") 
            {
                var text = msg.Content;
                if (msg.Parts != null && msg.Parts.Count > 0)
                {
                    foreach (var p in msg.Parts)
                    {
                        if (p.Type == "text")
                        {
                            text = p.Text;
                        }
                        else if (p.Type == "audio" && p.InlineData != null)
                        {
                            var audioClient = new OpenAI.Audio.AudioClient(_settings.OpenAI.DefaultAudioModel, _apiKey);
                            var optionsTranscription = new OpenAI.Audio.AudioTranscriptionOptions
                            {
                                ResponseFormat = OpenAI.Audio.AudioTranscriptionFormat.Verbose
                            };
                            using var stream = new System.IO.MemoryStream(p.InlineData);
                            var transcriptionResult = await audioClient.TranscribeAudioAsync(stream, "audio.ogg", optionsTranscription);
                            text = transcriptionResult.Value.Text;
                            
                            yield return new AiResponseUpdate { AudioTranscription = text };
                        }
                        else if (p.Type == "audio" && p.InlineData == null)
                        {
                            text = p.Text ?? $"[Audio Note: {p.MediaUrl}]";
                        }
                    }
                }
                chatMessages.Add(new UserChatMessage(text));
            }
            else if (msg.Role == "assistant")
            {
                if (msg.ToolCalls != null && msg.ToolCalls.Count > 0)
                {
                    var toolCalls = new List<ChatToolCall>();
                    foreach (var tc in msg.ToolCalls)
                    {
                        toolCalls.Add(ChatToolCall.CreateFunctionToolCall(tc.Id, tc.Name, BinaryData.FromString(tc.Arguments)));
                    }
                    chatMessages.Add(new AssistantChatMessage(toolCalls));
                }
                else
                {
                    chatMessages.Add(new AssistantChatMessage(msg.Content));
                }
            }
            else if (msg.Role == "tool")
            {
                chatMessages.Add(new ToolChatMessage(msg.ToolCallId, msg.Content));
            }
        }

        var options = new ChatCompletionOptions();
        foreach (var def in tools)
        {
            options.Tools.Add(ChatTool.CreateFunctionTool(
                def.Name,
                def.Description,
                BinaryData.FromString(def.ParametersSchema)
            ));
        }

        if (maxTokens.HasValue)
        {
            options.MaxOutputTokenCount = maxTokens;
        }

        var updates = chatClient.CompleteChatStreamingAsync(chatMessages, options, cancellationToken);
        
        await foreach (var update in updates.ConfigureAwait(false))
        {
            var aiUpdate = new AiResponseUpdate();
            
            if (update.ContentUpdate.Count > 0)
            {
                aiUpdate.TextUpdate = update.ContentUpdate[0].Text;
            }

            if (update.ToolCallUpdates.Count > 0)
            {
                var tu = update.ToolCallUpdates[0];
                aiUpdate.ToolCallUpdate = new AiToolCall
                {
                    Id = tu.ToolCallId ?? string.Empty,
                    Name = tu.FunctionName ?? string.Empty,
                    Arguments = tu.FunctionArgumentsUpdate?.ToString() ?? string.Empty,
                    Index = tu.Index
                };
            }

            if (update.FinishReason.HasValue)
            {
                aiUpdate.FinishReason = update.FinishReason.Value switch
                {
                    ChatFinishReason.Stop => "stop",
                    ChatFinishReason.ToolCalls => "tool_calls",
                    _ => update.FinishReason.Value.ToString()
                };
            }
            
            // Extract token usage metadata if available (typically on the last chunk)
            if (update.Usage != null)
            {
                aiUpdate.InputTokens = update.Usage.InputTokenCount;
                aiUpdate.OutputTokens = update.Usage.OutputTokenCount;
                aiUpdate.TotalTokens = update.Usage.TotalTokenCount;
                
                // .NET SDK might have specific fields for cached tokens, but if not we can try to find them or set to 0.
                // Assuming OpenAI hasn't exposed cached tokens cleanly in the v2 stable yet, we default to 0 for now.
                aiUpdate.CachedTokens = 0; 
            }

            yield return aiUpdate;
        }
    }
    public async Task<T?> GetStructuredResponseAsync<T>(List<AiMessage> history, CancellationToken cancellationToken)
    {
        var httpClient = _httpClientFactory.CreateClient("OpenAI");
        var clientOptions = new OpenAIClientOptions
        {
            Transport = new HttpClientPipelineTransport(httpClient)
        };
        
        var chatClient = new ChatClient(_settings.OpenAI.DefaultChatModel, new System.ClientModel.ApiKeyCredential(_apiKey), clientOptions);

        var chatMessages = new List<ChatMessage>();
        foreach (var msg in history)
        {
            if (msg.Role == "system") chatMessages.Add(new SystemChatMessage(msg.Content));
            else if (msg.Role == "user") chatMessages.Add(new UserChatMessage(msg.Content));
            else if (msg.Role == "assistant") chatMessages.Add(new AssistantChatMessage(msg.Content));
        }

        var options = new JsonSerializerOptions
        {
            Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() },
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            TypeInfoResolver = new System.Text.Json.Serialization.Metadata.DefaultJsonTypeInfoResolver()
        };

        var schemaOptions = new System.Text.Json.Schema.JsonSchemaExporterOptions
        {
            TransformSchemaNode = (context, node) =>
            {
                if (node is System.Text.Json.Nodes.JsonObject jsonObj)
                {
                    // 1. Limpiar el arreglo "type" y extraer el tipo base (ej. "object" o "string")
                    if (jsonObj.TryGetPropertyValue("type", out var rawTypeNode) && rawTypeNode is System.Text.Json.Nodes.JsonArray typeArray)
                    {
                        string? baseType = null;
                        foreach (var item in typeArray)
                        {
                            if (item is System.Text.Json.Nodes.JsonValue arrValue && arrValue.TryGetValue<string>(out var arrTypeStr) && arrTypeStr != "null")
                            {
                                baseType = arrTypeStr;
                                break;
                            }
                        }
                        
                        if (baseType != null)
                        {
                            jsonObj["type"] = baseType; // Reemplazamos el arreglo con el string simple
                        }
                    }

                    // 2. Lógica de validación y limpieza original
                    bool isObject = jsonObj.ContainsKey("properties");
                    
                    if (!isObject && jsonObj.TryGetPropertyValue("type", out var typeNode) && typeNode != null)
                    {
                        if (typeNode is System.Text.Json.Nodes.JsonValue value && value.TryGetValue<string>(out var typeString) && typeString == "object")
                        {
                            isObject = true;
                        }
                        // Mantenemos esto por si alguna otra parte de la generación esquemática deja arreglos
                        else if (typeNode is System.Text.Json.Nodes.JsonArray array)
                        {
                            foreach (var item in array)
                            {
                                if (item is System.Text.Json.Nodes.JsonValue arrValue && arrValue.TryGetValue<string>(out var arrTypeString) && arrTypeString == "object")
                                {
                                    isObject = true;
                                    break;
                                }
                            }
                        }
                    }

                    if (isObject)
                    {
                        jsonObj["additionalProperties"] = false;
                        
                        if (jsonObj.TryGetPropertyValue("properties", out var propsNode) && propsNode is System.Text.Json.Nodes.JsonObject propsObj)
                        {
                            var requiredArray = new System.Text.Json.Nodes.JsonArray();
                            foreach (var prop in propsObj)
                            {
                                requiredArray.Add(prop.Key);
                            }
                            jsonObj["required"] = requiredArray;
                        }
                    }
                }
                return node;
            }
        };

        var schemaNode = System.Text.Json.Schema.JsonSchemaExporter.GetJsonSchemaAsNode(options, typeof(T), schemaOptions);
        var schemaString = schemaNode.ToJsonString();

        var chatOptions = new ChatCompletionOptions
        {
            ResponseFormat = ChatResponseFormat.CreateJsonSchemaFormat("response_schema", BinaryData.FromString(schemaString), jsonSchemaIsStrict: true)
        };

        var response = await chatClient.CompleteChatAsync(chatMessages, chatOptions, cancellationToken);
        var content = response.Value.Content[0].Text;
        return JsonSerializer.Deserialize<T>(content, options);
    }
}
