using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Infrastructure.Services;

public interface IR2StorageService
{
    Task<string> UploadAsync(byte[] content, string key, string contentType, Guid? agentId = null, string targetType = "Desconocido", string? targetId = null, string? targetContext = null);
    Task DeleteAsync(string key);
    Task DeleteManyAsync(IEnumerable<string> keys);
    Task<long> GetFileSizeAsync(string key);
    Task DeleteWithQuotaLiberationAsync(string key, Guid agentId);
    Task DeleteManyWithQuotaLiberationAsync(IEnumerable<string> keys, Guid agentId);
}

public class R2StorageService : IR2StorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;
    private readonly string _publicUrl;
    private readonly IServiceScopeFactory _scopeFactory;

    public R2StorageService(IAmazonS3 s3Client, IConfiguration configuration, IServiceScopeFactory scopeFactory)
    {
        _s3Client = s3Client;
        _bucketName = configuration["R2_BUCKET_NAME"] ?? throw new ArgumentNullException("R2_BUCKET_NAME no está configurado.");
        _publicUrl = configuration["R2_PUBLIC_URL"] ?? throw new ArgumentNullException("R2_PUBLIC_URL no está configurado.");
        _scopeFactory = scopeFactory;
    }

    public async Task<string> UploadAsync(byte[] content, string key, string contentType, Guid? agentId = null, string targetType = "Desconocido", string? targetId = null, string? targetContext = null)
    {
        if (agentId.HasValue)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<CRM_Inmobiliario.Api.Infrastructure.Persistence.CrmDbContext>();
            var agent = await context.Agents.FindAsync(agentId.Value);
            
            if (agent != null) 
            {
                var year = DateTime.UtcNow.Year;
                var month = DateTime.UtcNow.Month;
                var usage = await context.AgentStorageUsages
                    .FirstOrDefaultAsync(u => u.AgentId == agentId.Value && u.Year == year && u.Month == month);
                
                if (usage == null)
                {
                    usage = new CRM_Inmobiliario.Api.Domain.Entities.AgentStorageUsage { AgentId = agentId.Value, Year = year, Month = month };
                    context.AgentStorageUsages.Add(usage);
                }

                var existingLogs = await context.AgentStorageFileLogs
                    .Where(l => l.AgentId == agentId.Value && l.ObjectKey == key && !l.IsDeleted)
                    .ToListAsync();
                    
                long overwrittenBytes = 0;
                foreach (var oldLog in existingLogs)
                {
                    oldLog.IsDeleted = true;
                    oldLog.DeletedAt = DateTimeOffset.UtcNow;
                    overwrittenBytes += oldLog.FileSizeBytes;
                }

                if (usage.TotalBytesUploaded - overwrittenBytes + content.Length > agent.MonthlyStorageBytesLimit ||
                    usage.UploadOpsCount + 1 > agent.MonthlyStorageUploadsLimit)
                {
                    throw new CRM_Inmobiliario.Api.Exceptions.StorageQuotaExceededException(
                        "Límite de almacenamiento alcanzado. Para más información revise su panel de inicio.");
                }

                usage.UploadOpsCount++;
                usage.TotalBytesUploaded += content.Length;
                usage.TotalBytesUploaded = Math.Max(0, usage.TotalBytesUploaded - overwrittenBytes);
                
                var fileLog = new CRM_Inmobiliario.Api.Domain.Entities.AgentStorageFileLog
                {
                    Id = Guid.NewGuid(),
                    AgentId = agentId.Value,
                    ObjectKey = key,
                    FileSizeBytes = content.Length,
                    TargetType = targetType,
                    TargetId = targetId,
                    Context = targetContext,
                    UploadedAt = DateTimeOffset.UtcNow,
                    IsDeleted = false
                };
                context.AgentStorageFileLogs.Add(fileLog);
                
                await context.SaveChangesAsync();
            }
        }

        using var memoryStream = new MemoryStream(content);
        
        var putRequest = new PutObjectRequest
        {
            BucketName = _bucketName,
            Key = key,
            InputStream = memoryStream,
            ContentType = contentType,
            DisablePayloadSigning = true
        };

        await _s3Client.PutObjectAsync(putRequest);

        // Retornar la URL pública concatenada (asegurando que no hayan slashes dobles)
        var baseUrl = _publicUrl.TrimEnd('/');
        var objectKey = key.TrimStart('/');
        return $"{baseUrl}/{objectKey}";
    }

    public async Task DeleteAsync(string key)
    {
        var deleteRequest = new DeleteObjectRequest
        {
            BucketName = _bucketName,
            Key = key
        };

        await _s3Client.DeleteObjectAsync(deleteRequest);
    }

    public async Task DeleteWithQuotaLiberationAsync(string key, Guid agentId)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<CRM_Inmobiliario.Api.Infrastructure.Persistence.CrmDbContext>();
        
        var log = await context.AgentStorageFileLogs
            .FirstOrDefaultAsync(l => l.AgentId == agentId && l.ObjectKey == key && !l.IsDeleted);
            
        long fileSize = log?.FileSizeBytes ?? 0;

        await DeleteAsync(key);
        
        if (log != null)
        {
            var year = DateTime.UtcNow.Year;
            var month = DateTime.UtcNow.Month;
            
            if (fileSize > 0)
            {
                await context.AgentStorageUsages
                    .Where(u => u.AgentId == agentId && u.Year == year && u.Month == month)
                    .ExecuteUpdateAsync(s => s.SetProperty(u => u.TotalBytesUploaded, u => Math.Max(0, u.TotalBytesUploaded - fileSize)));
            }
                
            await context.AgentStorageFileLogs
                .Where(l => l.Id == log.Id)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(l => l.IsDeleted, true)
                    .SetProperty(l => l.DeletedAt, DateTimeOffset.UtcNow));
        }
    }

    public async Task DeleteManyAsync(IEnumerable<string> keys)
    {
        var deleteRequest = new DeleteObjectsRequest
        {
            BucketName = _bucketName,
            Objects = keys.Select(k => new KeyVersion { Key = k }).ToList()
        };

        if (deleteRequest.Objects.Any())
        {
            await _s3Client.DeleteObjectsAsync(deleteRequest);
        }
    }

    public async Task DeleteManyWithQuotaLiberationAsync(IEnumerable<string> keys, Guid agentId)
    {
        var keyList = keys.ToList();
        if (keyList.Count == 0) return;

        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<CRM_Inmobiliario.Api.Infrastructure.Persistence.CrmDbContext>();

        var logsToDelete = await context.AgentStorageFileLogs
            .Where(l => l.AgentId == agentId && keyList.Contains(l.ObjectKey) && !l.IsDeleted)
            .Select(l => new { l.Id, l.ObjectKey, l.FileSizeBytes })
            .ToListAsync();

        long totalSize = logsToDelete.Sum(l => l.FileSizeBytes);

        await DeleteManyAsync(keyList);

        if (logsToDelete.Count > 0)
        {
            var year = DateTime.UtcNow.Year;
            var month = DateTime.UtcNow.Month;
            
            if (totalSize > 0)
            {
                await context.AgentStorageUsages
                    .Where(u => u.AgentId == agentId && u.Year == year && u.Month == month)
                    .ExecuteUpdateAsync(s => s.SetProperty(u => u.TotalBytesUploaded, u => Math.Max(0, u.TotalBytesUploaded - totalSize)));
            }
                
            await context.AgentStorageFileLogs
                .Where(l => l.AgentId == agentId && keyList.Contains(l.ObjectKey) && !l.IsDeleted)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(l => l.IsDeleted, true)
                    .SetProperty(l => l.DeletedAt, DateTimeOffset.UtcNow));
        }
    }

    public async Task<long> GetFileSizeAsync(string key)
    {
        try
        {
            var request = new GetObjectMetadataRequest
            {
                BucketName = _bucketName,
                Key = key
            };
            var response = await _s3Client.GetObjectMetadataAsync(request);
            return response.ContentLength;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return 0;
        }
    }
}
