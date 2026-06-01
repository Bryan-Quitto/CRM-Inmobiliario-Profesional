using System;
using System.Data;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.AI.Services;

[DapperAot]
public class CacheRenewalProcessor : ICacheRenewalProcessor
{
    private readonly string _connectionString;
    private readonly IGeminiApiClient _geminiApiClient;
    private readonly ILogger<CacheRenewalProcessor> _logger;

    public CacheRenewalProcessor(
        IConfiguration configuration, 
        IGeminiApiClient geminiApiClient,
        ILogger<CacheRenewalProcessor> logger)
    {
        _connectionString = Environment.GetEnvironmentVariable("DATABASE_URL") 
            ?? configuration.GetConnectionString("DefaultConnection") 
            ?? throw new ArgumentNullException("Connection string is missing");
        _geminiApiClient = geminiApiClient;
        _logger = logger;
    }

    public async Task ProcessRenewalsAsync(CancellationToken cancellationToken)
    {
        await using var dbConnection = new NpgsqlConnection(_connectionString);
        await dbConnection.OpenAsync(cancellationToken);
        
        using var transaction = await dbConnection.BeginTransactionAsync(cancellationToken);

        try
        {
            string selectSql = @"
                SELECT ""Id"", ""gemini_cache_id"" AS ""GeminiCacheId"", ""gemini_cache_expires_at"" AS ""GeminiCacheExpiresAt"", ""AiApiKey""
                FROM public.""Agents""
                WHERE ""byok_key_status"" = 'Valid'
                  AND ""HasActiveSubscription"" = true
                  AND ""gemini_cache_expires_at"" < NOW() + INTERVAL '10 minutes'
                FOR UPDATE SKIP LOCKED
                LIMIT 50;";
                
            var agentsToRenew = (await dbConnection.QueryAsync<AgentRenewalDto>(
                selectSql, transaction: transaction)).ToList();

            if (!agentsToRenew.Any())
            {
                await transaction.CommitAsync(cancellationToken);
                return;
            }

            foreach (var agent in agentsToRenew)
            {
                if (string.IsNullOrEmpty(agent.GeminiCacheId) || string.IsNullOrEmpty(agent.AiApiKey))
                    continue;

                var success = await _geminiApiClient.PatchTtlAsync(agent.GeminiCacheId, agent.AiApiKey, cancellationToken);
                
                if (success)
                {
                    string updateSql = @"
                        UPDATE public.""Agents""
                        SET ""gemini_cache_expires_at"" = NOW() + INTERVAL '1 hour'
                        WHERE ""Id"" = @Id;";
                        
                    await dbConnection.ExecuteAsync(updateSql, new { Id = agent.Id }, transaction: transaction);
                }
            }

            await transaction.CommitAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing cache renewals");
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}

public class AgentRenewalDto
{
    public Guid Id { get; set; }
    public string? GeminiCacheId { get; set; }
    public DateTimeOffset? GeminiCacheExpiresAt { get; set; }
    public string? AiApiKey { get; set; }
}
