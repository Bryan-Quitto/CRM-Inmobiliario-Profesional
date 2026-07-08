using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Infrastructure.Services;

public interface IR2StorageService
{
    Task<string> UploadAsync(byte[] content, string key, string contentType, Guid? agentId = null);
    Task DeleteAsync(string key);
    Task DeleteManyAsync(IEnumerable<string> keys);
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

    public async Task<string> UploadAsync(byte[] content, string key, string contentType, Guid? agentId = null)
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

                if (usage.TotalBytesUploaded + content.Length > agent.MonthlyStorageBytesLimit ||
                    usage.UploadOpsCount + 1 > agent.MonthlyStorageUploadsLimit)
                {
                    throw new CRM_Inmobiliario.Api.Exceptions.StorageQuotaExceededException(
                        "Límite de almacenamiento alcanzado. Para más información revise su panel de inicio.");
                }

                usage.UploadOpsCount++;
                usage.TotalBytesUploaded += content.Length;
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
}
