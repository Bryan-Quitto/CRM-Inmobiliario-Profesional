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

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Providers;

public class OpenAiProvider : ILLMProvider
{
    private readonly System.Net.Http.IHttpClientFactory _httpClientFactory;

    public OpenAiProvider(System.Net.Http.IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    public async IAsyncEnumerable<AiResponseUpdate> StreamChatAsync(List<AiMessage> history, List<AiToolDefinition> tools, string apiKey)
    {
        var httpClient = _httpClientFactory.CreateClient("OpenAI");
        var clientOptions = new OpenAIClientOptions
        {
            Transport = new HttpClientPipelineTransport(httpClient)
        };
        
        var chatClient = new ChatClient("gpt-4o-mini", new System.ClientModel.ApiKeyCredential(apiKey), clientOptions);

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
                            var audioClient = new OpenAI.Audio.AudioClient("whisper-1", apiKey);
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

            yield return aiUpdate;
        }
    }
}
