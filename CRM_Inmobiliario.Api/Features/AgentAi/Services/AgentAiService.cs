using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace CRM_Inmobiliario.Api.Features.AgentAi.Services;

public class AgentAiService
{
    private readonly AgentAiResponseGenerator _responseGenerator;
    private readonly AgentAiStreamProcessor _streamProcessor;

    public static readonly ConcurrentDictionary<string, SemaphoreSlim> Locks = new();
    public static readonly SemaphoreSlim GlobalConcurrencyLock = new(21, 21);

    public AgentAiService(
        ILogger<AgentAiService> logger,
        LLMProviderFactory providerFactory,
        AgentSystemPromptFactory promptFactory,
        ICoreAiToolExecutor toolExecutor,
        Microsoft.EntityFrameworkCore.IDbContextFactory<CrmDbContext> dbContextFactory,
        IServiceScopeFactory scopeFactory)
    {
        var tokenManager = new AgentAiTokenManager(dbContextFactory);
        _responseGenerator = new AgentAiResponseGenerator(logger, providerFactory, promptFactory, dbContextFactory, tokenManager);
        _streamProcessor = new AgentAiStreamProcessor(logger, providerFactory, promptFactory, dbContextFactory, scopeFactory, tokenManager);
    }

    public async Task<string> GenerateResponseAsync(Guid agentId, string message, CancellationToken cancellationToken = default)
    {
        var semaphore = Locks.GetOrAdd(agentId.ToString(), _ => new SemaphoreSlim(1, 1));
        
        await semaphore.WaitAsync(cancellationToken);
        
        try
        {
            await GlobalConcurrencyLock.WaitAsync(cancellationToken);
            try
            {
                return await _responseGenerator.GenerateAsync(agentId, message, cancellationToken);
            }
            finally
            {
                GlobalConcurrencyLock.Release();
            }
        }
        finally
        {
            semaphore.Release();
        }
    }

    public async IAsyncEnumerable<string> StreamResponseAsync(Guid agentId, Guid conversationId, string message, [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var semaphore = Locks.GetOrAdd(agentId.ToString(), _ => new SemaphoreSlim(1, 1));
        
        await semaphore.WaitAsync(cancellationToken);

        try
        {
            await GlobalConcurrencyLock.WaitAsync(cancellationToken);
            try
            {
                await foreach (var update in _streamProcessor.StreamAsync(agentId, conversationId, message, cancellationToken))
                {
                    yield return update;
                }
            }
            finally
            {
                GlobalConcurrencyLock.Release();
            }
        }
        finally
        {
            semaphore.Release();
        }
    }
}
