using Hangfire;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using CRM_Inmobiliario.Api.Features.Admin.Jobs;

namespace CRM_Inmobiliario.Api.Features.Admin;

public static class ReVectorizeFeature
{
    public record ReVectorizeCommand(bool Force);

    public static void MapReVectorizeEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/admin/re-vectorize", async (
            ReVectorizeCommand command, 
            IBackgroundJobClient backgroundJobs,
            CRM_Inmobiliario.Api.Infrastructure.Persistence.CrmDbContext db) =>
        {
            int count = command.Force 
                ? await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.CountAsync(db.Properties)
                : await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.CountAsync(System.Linq.Queryable.Where(db.Properties, p => p.VectorEmbedding == null));

            backgroundJobs.Enqueue<BulkVectorizationJob>(j => j.ProcessBulkAsync(command.Force));
            
            return Results.Accepted(value: new { mensaje = "Proceso en segundo plano iniciado", count });
        })
        .WithTags("Admin")
        .WithName("ReVectorize")
        .RequireAuthorization("AdminPolicy");
    }
}
