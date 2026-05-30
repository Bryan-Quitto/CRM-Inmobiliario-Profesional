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

    public OpenAiProvider(System.Net.Http.IHttpClientFactory httpClientFactory, IOptions<LLMSettings> options)
    {
        _httpClientFactory = httpClientFactory;
        _settings = options.Value;
    }

    public async IAsyncEnumerable<AiResponseUpdate> StreamChatAsync(List<AiMessage> history, List<AiToolDefinition> tools, string apiKey)
    {
        var httpClient = _httpClientFactory.CreateClient("OpenAI");
        var clientOptions = new OpenAIClientOptions
        {
            Transport = new HttpClientPipelineTransport(httpClient)
        };
        
        var chatClient = new ChatClient(_settings.OpenAI.DefaultChatModel, new System.ClientModel.ApiKeyCredential(apiKey), clientOptions);

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
                            var audioClient = new OpenAI.Audio.AudioClient(_settings.OpenAI.DefaultAudioModel, apiKey);
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

        var updates = chatClient.CompleteChatStreamingAsync(chatMessages, options);
        
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
                    Arguments = tu.FunctionArgumentsUpdate?.ToString() ?? string.Empty
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
}
