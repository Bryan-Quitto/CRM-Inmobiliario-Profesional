using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;
using Microsoft.Extensions.Configuration;

namespace CRM_Inmobiliario.Api.Infrastructure.Services;

public interface IR2StorageService
{
    Task<string> UploadAsync(byte[] content, string key, string contentType);
    Task DeleteAsync(string key);
    Task DeleteManyAsync(IEnumerable<string> keys);
}

public class R2StorageService : IR2StorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;
    private readonly string _publicUrl;

    public R2StorageService(IAmazonS3 s3Client, IConfiguration configuration)
    {
        _s3Client = s3Client;
        _bucketName = configuration["R2_BUCKET_NAME"] ?? throw new ArgumentNullException("R2_BUCKET_NAME no está configurado.");
        _publicUrl = configuration["R2_PUBLIC_URL"] ?? throw new ArgumentNullException("R2_PUBLIC_URL no está configurado.");
    }

    public async Task<string> UploadAsync(byte[] content, string key, string contentType)
    {
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
